import { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const connection = await pool.getConnection();

    try {
      const [batches] = await connection.query(
        `SELECT 
          b.id,
          b.status,
          b.total_departments,
          b.processed_departments,
          (SELECT COUNT(*) FROM payroll_batch_items WHERE batch_id = b.id AND status = 'ERROR') as error_count,
          b.start_time,
          b.end_time
        FROM payroll_batches b
        ORDER BY b.start_time DESC
        LIMIT 10`
      ) as [any[], any];

      res.status(200).json(batches);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Failed to fetch batch history:', error);
    res.status(500).json({ error: 'Failed to fetch batch history' });
  }
}