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

  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid shift ID' });
  }

  // PUT - Update a shift
  if (req.method === 'PUT') {
    try {
      const { employeeId, shiftType, start, end, notes } = req.body;

      if (!employeeId || !shiftType || !start || !end) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const [result] = await pool.query<ResultSetHeader>(
        `UPDATE shifts 
         SET employee_id = ?, shift_type = ?, start_time = ?, end_time = ?, notes = ?
         WHERE id = ?`,
        [employeeId, shiftType, new Date(start), new Date(end), notes || null, id]
      );

      if (result.affectedRows === 1) {
        const [updatedShift] = await pool.query<ShiftRecord[]>(
          `SELECT 
            s.id,
            s.employee_id as employeeId,
            CONCAT(e.first_name, ' ', e.last_name) as employeeName,
            s.shift_type as shiftType,
            s.start_time as start,
            s.end_time as end,
            s.notes
          FROM shifts s
          JOIN employees e ON s.employee_id = e.id
          WHERE s.id = ?`,
          [id]
        );

        return res.status(200).json(updatedShift[0]);
      }

      return res.status(404).json({ error: 'Shift not found' });
    } catch (error: any) {
      console.error('Failed to update shift:', error);
      return res.status(500).json({ 
        error: 'Failed to update shift',
        details: error.message 
      });
    }
  }

  // DELETE - Delete a shift
  if (req.method === 'DELETE') {
    try {
      const [result] = await pool.query<ResultSetHeader>(
        'DELETE FROM shifts WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 1) {
        return res.status(200).json({ message: 'Shift deleted successfully' });
      }

      return res.status(404).json({ error: 'Shift not found' });
    } catch (error: any) {
      console.error('Failed to delete shift:', error);
      return res.status(500).json({ 
        error: 'Failed to delete shift',
        details: error.message 
      });
    }
  }

  // GET - Get a single shift
  if (req.method === 'GET') {
    try {
      const [shift] = await pool.query<ShiftRecord[]>(
        `SELECT 
          s.id,
          s.employee_id as employeeId,
          CONCAT(e.first_name, ' ', e.last_name) as employeeName,
          s.shift_type as shiftType,
          s.start_time as start,
          s.end_time as end,
          s.notes
        FROM shifts s
        JOIN employees e ON s.employee_id = e.id
        WHERE s.id = ?`,
        [id]
      );

      if (shift.length === 0) {
        return res.status(404).json({ error: 'Shift not found' });
      }

      return res.status(200).json(shift[0]);
    } catch (error: any) {
      console.error('Failed to fetch shift:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch shift',
        details: error.message 
      });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}