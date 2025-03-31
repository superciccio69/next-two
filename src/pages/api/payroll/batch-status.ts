import { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { batchId } = req.query;

  try {
    const [results] = await pool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'PROCESSED' THEN 1 ELSE 0 END) as processed,
        SUM(CASE WHEN status = 'ERROR' THEN 1 ELSE 0 END) as errors
       FROM payroll_batch_items
       WHERE batch_id = ?`,
      [batchId]
    ) as [any[], any];

    res.status(200).json(results[0]);
  } catch (error) {
    console.error('Failed to fetch batch status:', error);
    res.status(500).json({ error: 'Failed to fetch batch status' });
  }
}