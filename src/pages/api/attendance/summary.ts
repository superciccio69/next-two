import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface SummaryRow extends RowDataPacket {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const [summary] = await pool.query<SummaryRow[]>(`
        SELECT 
          COUNT(DISTINCT DATE(attendance_date)) as total_days,
          COUNT(DISTINCT CASE WHEN status = 'present' THEN DATE(attendance_date) END) as present_days,
          COUNT(DISTINCT CASE WHEN status = 'absent' THEN DATE(attendance_date) END) as absent_days,
          COUNT(DISTINCT CASE WHEN status = 'late' THEN DATE(attendance_date) END) as late_days
        FROM attendance
        WHERE DATE(attendance_date) BETWEEN DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND CURDATE()
      `);

      return res.status(200).json(summary[0] || {
        total_days: 0,
        present_days: 0,
        absent_days: 0,
        late_days: 0
      });
    } catch (error) {
      console.error('Failed to fetch summary:', error);
      return res.status(500).json({ error: 'Failed to fetch summary' });
    }
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}