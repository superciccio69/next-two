import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import pool from '@/lib/db';

interface ResultSetHeader {
  insertId: number;
  affectedRows: number;
  changedRows?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const [rows] = await pool.query('SELECT * FROM employees') as [any[], any];
      return res.status(200).json(rows);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      return res.status(500).json({ error: 'Failed to fetch employees' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, email, department, role, base_salary } = req.body;

      // Validate required fields
      if (!name || !email || !department || !role || base_salary === undefined) {
        return res.status(400).json({ 
          error: 'All fields are required',
          received: { name, email, department, role, base_salary }
        });
      }

      // Validate salary
      if (isNaN(base_salary) || base_salary < 0) {
        return res.status(400).json({ error: 'Invalid salary value' });
      }

      // Check if email already exists
      const [existing] = await pool.query(
        'SELECT id FROM employees WHERE email = ?',
        [email]
      ) as [any[], any];

      if (existing.length > 0) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      // Insert new employee
      const [result] = await pool.query(
        `INSERT INTO employees (name, email, department, role, base_salary) 
         VALUES (?, ?, ?, ?, ?)`,
        [name, email, department, role, base_salary]
      ) as [any, any];

      const newEmployee = {
        id: result.insertId,
        name,
        email,
        department,
        role,
        base_salary
      };

      return res.status(201).json(newEmployee);
    } catch (error) {
      console.error('Failed to save employee:', error);
      return res.status(500).json({ error: 'Failed to save employee' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, hire_date, ...updateData } = req.body;

      let adjustedDate = hire_date;
      if (hire_date) {
        const date = new Date(hire_date);
        date.setDate(date.getDate() + 1);
        adjustedDate = date.toISOString().split('T')[0];
      }

      const [result] = await pool.query(
        `UPDATE employees 
         SET name = ?, 
             email = ?, 
             phone = ?,
             department = ?, 
             role = ?, 
             base_salary = ?,
             status = ?,
             hire_date = ?,
             address = ?,
             tax_id = ?,
             bank_account = ?,
             emergency_contact = ?,
             emergency_phone = ?
         WHERE id = ?`,
        [
          updateData.name, 
          updateData.email, 
          updateData.phone,
          updateData.department, 
          updateData.role, 
          updateData.base_salary,
          updateData.status,
          adjustedDate,  // Usiamo la data corretta
          updateData.address,
          updateData.tax_id,
          updateData.bank_account,
          updateData.emergency_contact,
          updateData.emergency_phone,
          id
        ]
      );

      return res.status(200).json({ 
        id,
        ...updateData,
        hire_date: adjustedDate,
        status: updateData.status || 'active'  // Assicuriamo che lo status sia incluso
      });
    } catch (error) {
      console.error('Failed to update employee:', error);
      return res.status(500).json({ error: 'Failed to update employee' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { 
        name, 
        email, 
        phone,
        department, 
        role, 
        base_salary,
        status,
        hire_date,
        address,
        tax_id,
        bank_account,
        emergency_contact,
        emergency_phone
      } = req.body;

      const [result] = await pool.query(
        `INSERT INTO employees (
          name, email, phone, department, role, base_salary,
          status, hire_date, address, tax_id, bank_account,
          emergency_contact, emergency_phone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name, email, phone, department, role, base_salary,
          status, hire_date, address, tax_id, bank_account,
          emergency_contact, emergency_phone
        ]
      ) as [ResultSetHeader, any];  // Add type assertion here

      const newEmployee = {
        id: result.insertId,
        name, 
        email, 
        phone,
        department, 
        role, 
        base_salary,
        status,
        hire_date,
        address,
        tax_id,
        bank_account,
        emergency_contact,
        emergency_phone
      };

      return res.status(201).json(newEmployee);
    } catch (error) {
      console.error('Failed to create employee:', error);
      return res.status(500).json({ error: 'Failed to create employee' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      await pool.query('DELETE FROM employees WHERE id = ?', [id]);
      return res.status(200).json({ message: 'Employee deleted successfully' });
    } catch (error) {
      console.error('Failed to delete employee:', error);
      return res.status(500).json({ error: 'Failed to delete employee' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}