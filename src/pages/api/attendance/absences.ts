import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface AbsenceRecord extends RowDataPacket {
  id: number;
  employee_name: string;
  type: string;
  start_date: string;
  end_date: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const [absences] = await pool.query<AbsenceRecord[]>(`
        SELECT
          a.id,
          e.name as employee_name,
          a.type,
          a.start_date,
          a.end_date
        FROM absences a
        JOIN employees e ON a.employee_id = e.id
        WHERE a.end_date >= CURDATE()
        ORDER BY a.start_date ASC
      `);

      return res.status(200).json(absences || []);
    } catch (error: any) {
      console.error('Failed to fetch absences:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch absences',
        details: error.message 
      });
    }
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}