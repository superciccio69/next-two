import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface ShiftRecord extends RowDataPacket {
  id: number;
  employee_id: number;
  employee_name: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  notes: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // GET - Fetch all shifts
  if (req.method === 'GET') {
    try {
      // Update the SQL query to use the correct column name
      const [shifts] = await pool.query<ShiftRecord[]>(`
        SELECT 
          s.id,
          s.employee_id as employeeId,
          e.name as employeeName,
          s.shift_type as shiftType,
          s.start_time as start,
          s.end_time as end,
          s.notes
        FROM shifts s
        JOIN employees e ON s.employee_id = e.id
        ORDER BY s.start_time ASC
      `);

      return res.status(200).json(shifts || []);
    } catch (error: any) {
      console.error('Failed to fetch shifts:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch shifts',
        details: error.message 
      });
    }
  }

  // POST - Create a new shift
  if (req.method === 'POST') {
    try {
      const { employeeId, shiftType, start, end, notes } = req.body;

      if (!employeeId || !shiftType || !start || !end) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO shifts (employee_id, shift_type, start_time, end_time, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [employeeId, shiftType, new Date(start), new Date(end), notes || null]
      );

      if (result.affectedRows === 1) {
        const [newShift] = await pool.query<ShiftRecord[]>(
          `SELECT 
            s.id,
            s.employee_id as employeeId,
            e.name as employeeName,
            s.shift_type as shiftType,
            s.start_time as start,
            s.end_time as end,
            s.notes
          FROM shifts s
          JOIN employees e ON s.employee_id = e.id
          WHERE s.id = ?`,
          [result.insertId]
        );

        return res.status(201).json(newShift[0]);
      }

      return res.status(500).json({ error: 'Failed to create shift' });
    } catch (error: any) {
      console.error('Failed to create shift:', error);
      return res.status(500).json({ 
        error: 'Failed to create shift',
        details: error.message 
      });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}