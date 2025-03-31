import { NextApiRequest, NextApiResponse } from 'next';
import { createPool } from 'mysql2/promise';
import { broadcastBatchUpdate } from '@/utils/websocket';

const pool = createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { batchId } = req.query;
  
  if (!batchId) {
    return res.status(400).json({ error: 'Batch ID is required' });
  }

  try {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Get failed items
      const [failedItems] = await connection.query(
        `SELECT * FROM payroll_batch_items 
         WHERE batch_id = ? AND status = 'ERROR'`,
        [batchId]
      ) as [any[], any];

      // Schedule retries
      for (const item of failedItems) {
        await connection.query(
          `INSERT INTO retry_queue (
            batch_id, department, original_error,
            scheduled_time, attempts
          ) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE), 0)`,
          [batchId, item.department, item.error]
        );
      }

      await connection.commit();

      broadcastBatchUpdate({
        type: 'RETRY_SCHEDULED',
        batchId: batchId,
        itemCount: failedItems.length
      });

      res.status(200).json({ 
        message: 'Retry scheduled',
        itemCount: failedItems.length 
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Failed to schedule retry:', error);
    res.status(500).json({ error: 'Failed to schedule retry' });
  }
}