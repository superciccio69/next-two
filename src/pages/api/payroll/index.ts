import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';  // Add this import

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const [rows] = await pool.query(`
        SELECT p.*, e.name as employee_name 
        FROM payrolls p 
        JOIN employees e ON p.employee_id = e.id 
        ORDER BY p.period_year DESC, p.period_month DESC
      `) as [any[], any];
      
      return res.status(200).json(rows);
    } catch (error) {
      console.error('Failed to fetch payrolls:', error);
      return res.status(500).json({ error: 'Failed to fetch payrolls' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { employee_id, period_month, period_year, ...payrollData } = req.body;

      // Verifica se esiste già una busta paga per questo dipendente in questo periodo
      const [existing] = await pool.query(
        'SELECT id FROM payrolls WHERE employee_id = ? AND period_month = ? AND period_year = ?',
        [employee_id, period_month, period_year]
      ) as [any[], any];

      if (existing.length > 0) {
        return res.status(400).json({ error: 'Payroll already exists for this period' });
      }

      const [result] = await pool.query(
        `INSERT INTO payrolls (
          employee_id, period_month, period_year, gross_salary,
          net_salary, total_deductions, total_contributions,
          inps_contribution, irpef_tax, regional_tax, municipal_tax
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          employee_id, period_month, period_year,
          payrollData.gross_salary, payrollData.net_salary,
          payrollData.total_deductions, payrollData.total_contributions,
          payrollData.inps_contribution, payrollData.irpef_tax,
          payrollData.regional_tax, payrollData.municipal_tax
        ]
      ) as [ResultSetHeader, any];  // Add type assertion here

      return res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
      console.error('Failed to create payroll:', error);
      return res.status(500).json({ error: 'Failed to create payroll' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, employee_id, period_month, period_year, ...payrollData } = req.body;

      const [result] = await pool.query(
        `UPDATE payrolls SET 
          employee_id = ?,
          period_month = ?,
          period_year = ?,
          gross_salary = ?,
          net_salary = ?,
          total_deductions = ?,
          total_contributions = ?,
          inps_contribution = ?,
          irpef_tax = ?,
          regional_tax = ?,
          municipal_tax = ?,
          status = ?
        WHERE id = ?`,
        [
          employee_id,
          period_month,
          period_year,
          payrollData.gross_salary,
          payrollData.net_salary,
          payrollData.total_deductions,
          payrollData.total_contributions,
          payrollData.inps_contribution,
          payrollData.irpef_tax,
          payrollData.regional_tax,
          payrollData.municipal_tax,
          payrollData.status,
          id
        ]
      ) as [ResultSetHeader, any];

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Payroll not found' });
      }

      return res.status(200).json({ message: 'Payroll updated successfully' });
    } catch (error) {
      console.error('Failed to update payroll:', error);
      return res.status(500).json({ error: 'Failed to update payroll' });
    }
  }

  // Update the allowed methods header
  res.setHeader('Allow', ['GET', 'POST', 'PUT']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}