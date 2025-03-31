import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface Employee extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  department: string;
  position: string;
  base_salary: number;
  hire_date: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  switch (req.method) {
    case 'GET':
      try {
        const [rows] = await pool.query<Employee[]>(
          'SELECT * FROM employees WHERE id = ?',
          [id]
        );
        
        if (!rows[0]) {
          return res.status(404).json({ error: 'Employee not found' });
        }
        
        res.status(200).json(rows[0]);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch employee' });
      }
      break;

    case 'PUT':
      try {
        const { name, email, department, position, base_salary, hire_date, status } = req.body;
        
        const [result] = await pool.query<ResultSetHeader>(
          `UPDATE employees 
           SET name = ?, email = ?, department = ?, position = ?, 
               base_salary = ?, hire_date = ?, status = ?
           WHERE id = ?`,
          [name, email, department, position, base_salary, hire_date, status, id]
        );
        
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Employee not found' });
        }
        
        res.status(200).json({ message: 'Employee updated successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to update employee' });
      }
      break;

    case 'DELETE':
      try {
        const [result] = await pool.query<ResultSetHeader>(
          'DELETE FROM employees WHERE id = ?',
          [id]
        );
        
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Employee not found' });
        }
        
        res.status(200).json({ message: 'Employee deleted successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete employee' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}