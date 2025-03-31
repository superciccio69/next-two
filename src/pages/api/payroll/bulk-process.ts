import { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { sendEmail } from '@/utils/email';
import { broadcastBatchUpdate } from '@/utils/websocket';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function processWithRetry(fn: () => Promise<any>, retries = MAX_RETRIES): Promise<any> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return processWithRetry(fn, retries - 1);
    }
    throw error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { month, year, departments } = req.body;
  const batchId = Date.now().toString();
  const errors: Array<{ department: string; error: string; employeeId?: number }> = [];

  try {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Create batch record with more details
      await connection.query(
        `INSERT INTO payroll_batches (
          id, status, total_departments, start_time, 
          month, year, created_by
        ) VALUES (?, 'PROCESSING', ?, NOW(), ?, ?, ?)`,
        [batchId, departments.length, month, year, req.headers['user-id'] || 'system']
      );

      // Process each department
      for (const dept of departments) {
        try {
          broadcastBatchUpdate({
            type: 'DEPARTMENT_START',
            batchId,
            data: { department: dept }
          });

          // Get employees from selected departments
          const [employees] = await connection.query(
            `SELECT id, name, base_salary, department 
             FROM employees 
             WHERE department = ?`,
            [dept]
          ) as [any[], any];

          let processedCount = 0;
          // Process payroll for each employee
          for (const employee of employees) {
            try {
              await processWithRetry(async () => {
                // Check if payroll already exists
                const [existing] = await connection.query(
                  `SELECT id FROM payroll 
                   WHERE employee_id = ? AND month = ? AND year = ?`,
                  [employee.id, month, year]
                ) as [any[], any];

                if (existing.length === 0) {
                  // Calculate payroll components
                  const overtime = Math.floor(Math.random() * 1000); // Example calculation
                  const deductions = employee.base_salary * 0.2; // Example: 20% deductions
                  const netSalary = employee.base_salary + overtime - deductions;

                  // Insert new payroll record
                  await connection.query(
                    `INSERT INTO payroll (
                      employee_id, month, year, base_salary, 
                      overtime, deductions, net_salary, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PROCESSED')`,
                    [
                      employee.id,
                      month,
                      year,
                      employee.base_salary,
                      overtime,
                      deductions,
                      netSalary,
                    ]
                  );
                }
              },

              processedCount++);
              broadcastBatchUpdate({
                type: 'PROGRESS',
                batchId,
                data: {
                  department: dept,
                  processed: processedCount,
                  total: employees.length
                }
              });
            } catch (error) {
              errors.push({
                department: dept,
                error: error instanceof Error ? error.message : 'Processing failed',
                employeeId: employee.id
              });
            }
          }

          // Update batch progress
          await connection.query(
            `UPDATE payroll_batches 
             SET processed_departments = processed_departments + 1,
                 last_processed_time = NOW()
             WHERE id = ?`,
            [batchId]
          );

          broadcastBatchUpdate({
            type: 'DEPARTMENT_COMPLETE',
            batchId,
            data: { department: dept }
          });

        } catch (error) {
          errors.push({
            department: dept,
            error: error instanceof Error ? error.message : 'Department processing failed'
          });

          await connection.query(
            `INSERT INTO payroll_batch_items (
              batch_id, department, status, error, 
              created_at, retry_count
            ) VALUES (?, ?, 'ERROR', ?, NOW(), 0)`,
            [batchId, dept, error instanceof Error ? error.message : 'Processing failed']
          );
        }
      }

      // Update final batch status
      const finalStatus = errors.length > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED';
      await connection.query(
        `UPDATE payroll_batches 
         SET status = ?, 
             end_time = NOW(),
             error_count = ?
         WHERE id = ?`,
        [finalStatus, errors.length, batchId]
      );

      await connection.commit();

      // Send detailed email notification
      await sendEmail({
        subject: `Payroll Batch ${batchId} Processing Complete`,
        text: `
          Payroll processing for ${month}/${year} has been completed.
          Status: ${finalStatus}
          Total Departments: ${departments.length}
          Errors: ${errors.length}
          
          ${errors.length > 0 ? '\nError Details:\n' + JSON.stringify(errors, null, 2) : ''}
        `
      });

      broadcastBatchUpdate({
        type: 'BATCH_COMPLETE',
        batchId,
        data: {
          status: finalStatus,
          errors: errors.length
        }
      });

      res.status(200).json({ 
        batchId,
        message: 'Bulk processing completed',
        status: finalStatus,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Bulk processing failed:', error);
    res.status(500).json({ 
      error: 'Failed to process payroll',
      details: error instanceof Error ? error.message : undefined
    });
  }
}