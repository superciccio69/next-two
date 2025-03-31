import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';  // Add this import

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const [rows] = await pool.query(
        `SELECT p.*, e.name as employee_name 
         FROM payrolls p 
         JOIN employees e ON p.employee_id = e.id 
         WHERE p.id = ?`,
        [id]
      ) as [any[], any];

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Payroll not found' });
      }

      return res.status(200).json(rows[0]);
    } catch (error) {
      console.error('Failed to fetch payroll:', error);
      return res.status(500).json({ error: 'Failed to fetch payroll' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { status } = req.body;

      const [result] = await pool.query(
        'UPDATE payrolls SET status = ? WHERE id = ?',
        [status, id]
      );

      return res.status(200).json({ message: 'Payroll updated successfully' });
    } catch (error) {
      console.error('Failed to update payroll:', error);
      return res.status(500).json({ error: 'Failed to update payroll' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const [result] = await pool.query(
        'DELETE FROM payrolls WHERE id = ? AND status = "draft"',
        [id]
      ) as [ResultSetHeader, any];  // Add type assertion here

      if (result.affectedRows === 0) {
        return res.status(400).json({ 
          error: 'Cannot delete payroll that is not in draft status' 
        });
      }

      return res.status(200).json({ message: 'Payroll deleted successfully' });
    } catch (error) {
      console.error('Failed to delete payroll:', error);
      return res.status(500).json({ error: 'Failed to delete payroll' });
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}