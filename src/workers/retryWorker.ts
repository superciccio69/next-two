import pool from '@/lib/db';
import { broadcastBatchUpdate } from '@/utils/websocket';
import { sendEmail } from '@/utils/email';
import { logRetryProcess } from '@/utils/logger';

interface RetryItem {
  id: number;
  batch_id: string;
  department: string;
  original_error: string;
  attempts: number;
}

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 5 * 60 * 1000; // 5 minutes

async function processRetry(item: RetryItem) {
  await logRetryProcess('Starting retry process', {
    batchId: item.batch_id,
    department: item.department,
    attempt: item.attempts + 1
  });

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await logRetryProcess('Transaction started');

    // Get failed payroll records for the department
    const [failedRecords] = await connection.query(
      `SELECT p.* 
       FROM payroll p
       JOIN employees e ON p.employee_id = e.id
       WHERE e.department = ? AND p.status = 'ERROR'
       AND p.batch_id = ?`,
      [item.department, item.batch_id]
    ) as [any[], any];

    await logRetryProcess('Found failed records', { count: failedRecords.length });

    let successCount = 0;
    const errors = [];

    // Retry each failed record
    for (const record of failedRecords) {
      try {
        await logRetryProcess('Processing record', { 
          employeeId: record.employee_id,
          batchId: item.batch_id 
        });

        // Recalculate payroll
        const overtime = Math.floor(Math.random() * 1000);
        const deductions = record.base_salary * 0.2;
        const netSalary = record.base_salary + overtime - deductions;

        await connection.query(
          `UPDATE payroll 
           SET overtime = ?, deductions = ?, net_salary = ?, status = 'PROCESSED'
           WHERE id = ?`,
          [overtime, deductions, netSalary, record.id]
        );

        successCount++;
        await logRetryProcess('Record processed successfully', { 
          employeeId: record.employee_id 
        });
      } catch (error) {
        await logRetryProcess('Record processing failed', {
          employeeId: record.employee_id,
          error: error instanceof Error ? error.message : 'Retry failed'
        });
        errors.push({
          employeeId: record.employee_id,
          error: error instanceof Error ? error.message : 'Retry failed'
        });
      }
    }

    // Update retry status
    if (errors.length === 0) {
      await logRetryProcess('All records processed successfully', {
        batchId: item.batch_id,
        department: item.department
      });

      await connection.query(
        `UPDATE payroll_batch_items 
         SET status = 'PROCESSED', retry_count = retry_count + 1
         WHERE batch_id = ? AND department = ?`,
        [item.batch_id, item.department]
      );
    } else if (item.attempts >= MAX_RETRY_ATTEMPTS) {
      await logRetryProcess('Max retry attempts reached', {
        batchId: item.batch_id,
        department: item.department,
        errors
      });

      await connection.query(
        `UPDATE payroll_batch_items 
         SET status = 'FAILED', retry_count = retry_count + 1,
         error = ?
         WHERE batch_id = ? AND department = ?`,
        [JSON.stringify(errors), item.batch_id, item.department]
      );
    }

    await connection.commit();
    await logRetryProcess('Transaction committed');

    // Send notifications
    broadcastBatchUpdate({
      type: 'RETRY_UPDATE',
      batchId: item.batch_id,
      data: {
        department: item.department,
        success: successCount,
        failed: errors.length
      }
    });

    if (item.attempts >= MAX_RETRY_ATTEMPTS && errors.length > 0) {
      await sendEmail({
        subject: `Retry Failed for Batch ${item.batch_id}`,
        text: `Maximum retry attempts reached for department ${item.department}.\n\nErrors:\n${JSON.stringify(errors, null, 2)}`
      });
    }

  } catch (error) {
    await connection.rollback();
    await logRetryProcess('Process failed - transaction rolled back', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  } finally {
    connection.release();
    await logRetryProcess('Connection released');
  }
}

export async function startRetryWorker() {
  await logRetryProcess('Retry worker started');

  setInterval(async () => {
    try {
      await logRetryProcess('Starting retry cycle');
      const connection = await pool.getConnection();

      try {
        // Get items to retry
        const [items] = await connection.query(
          `SELECT * FROM retry_queue 
           WHERE scheduled_time <= NOW() 
           AND attempts < ?
           LIMIT 5`,
          [MAX_RETRY_ATTEMPTS]
        ) as [RetryItem[], any];

        await logRetryProcess('Found items to retry', { count: items.length });

        for (const item of items) {
          try {
            await processRetry(item);
          } catch (error) {
            await logRetryProcess('Retry failed', {
              batchId: item.batch_id,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      } finally {
        connection.release();
        await logRetryProcess('Retry cycle completed');
      }
    } catch (error) {
      await logRetryProcess('Retry worker error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, RETRY_DELAY);
}