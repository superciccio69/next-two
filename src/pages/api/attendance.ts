import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface AttendanceRecord extends RowDataPacket {
  id: number;
  employee_name: string;
  status: string;
  check_in: string;
  check_out: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const [attendanceRecords] = await pool.query<AttendanceRecord[]>(`
        SELECT 
          a.id,
          CONCAT(e.name, ' ', e.lastname) as employee_name,
          a.status,
          a.check_in,
          a.check_out
        FROM attendance a
        JOIN employees e ON a.employee_id = e.id
        WHERE DATE(a.attendance_date) = CURDATE()
      `);

      return res.status(200).json(attendanceRecords || []);
    } catch (error: any) {
      console.error('Failed to fetch attendance:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch attendance records',
        details: error.message 
      });
    }
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}