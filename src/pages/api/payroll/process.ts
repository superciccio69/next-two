import { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { month, year } = req.body;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Get all active employees
      const [employees] = await connection.query(
        'SELECT id, name, base_salary FROM employees WHERE status = "ACTIVE"'
      ) as [any[], any];  // Type assertion to specify the expected structure

      // Process payroll for each employee
      const payrollRecords = await Promise.all(
        employees.map(async (employee: any) => {
          // Calculate overtime
          const [overtimeHours] = await connection.query(
            `SELECT SUM(TIMESTAMPDIFF(HOUR, start_time, end_time)) as total_hours 
             FROM shifts 
             WHERE employee_id = ? AND MONTH(start_time) = ? AND YEAR(start_time) = ?`,
            [employee.id, month, year]
          ) as [{ total_hours: number }[], any];

          const overtime = Math.max(0, (overtimeHours[0]?.total_hours || 0) - 160) * (employee.base_salary / 160 * 1.5);
          const deductions = employee.base_salary * 0.2; // Example: 20% for taxes and other deductions
          const netSalary = employee.base_salary + overtime - deductions;

          // Insert payroll record
          const [result] = await connection.query(
            `INSERT INTO payrolls (employee_id, month, year, base_salary, overtime, deductions, net_salary, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'PROCESSED')`,
            [employee.id, month, year, employee.base_salary, overtime, deductions, netSalary]
          ) as [ResultSetHeader, any];

          return {
            id: result.insertId,
            employeeId: employee.id,
            employeeName: employee.name,
            month,
            year,
            baseSalary: employee.base_salary,
            overtime,
            deductions,
            netSalary,
            status: 'PROCESSED'
          };
        })
      );

      await connection.commit();
      res.status(200).json(payrollRecords);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to process payroll' });
  }
}