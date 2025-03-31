import { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { year } = req.query;
    const connection = await pool.getConnection();

    try {
      // Total payroll and average salary
      const [totals] = await connection.query(
        `SELECT 
          SUM(net_salary) as total_payroll,
          AVG(net_salary) as average_salary,
          COUNT(DISTINCT employee_id) as total_employees
         FROM payrolls
         WHERE YEAR(created_at) = ?`,
        [year]
      ) as [any[], any];

      // Department costs
      const [departmentCosts] = await connection.query(
        `SELECT 
          e.department,
          SUM(p.net_salary) as total_cost
         FROM payrolls p
         JOIN employees e ON p.employee_id = e.id
         WHERE YEAR(p.created_at) = ?
         GROUP BY e.department`,
        [year]
      ) as [any[], any];

      // Monthly trend
      const [monthlyTrend] = await connection.query(
        `SELECT 
          MONTH(created_at) as month,
          SUM(net_salary) as total
         FROM payrolls
         WHERE YEAR(created_at) = ?
         GROUP BY MONTH(created_at)
         ORDER BY month`,
        [year]
      ) as [any[], any];

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyData = monthlyTrend.reduce((acc: Record<string, number>, curr: any) => {
        acc[monthNames[curr.month - 1]] = curr.total;
        return acc;
      }, {});

      res.status(200).json({
        totalPayroll: totals[0].total_payroll || 0,
        averageSalary: totals[0].average_salary || 0,
        totalEmployees: totals[0].total_employees || 0,
        departmentCosts: departmentCosts.reduce((acc: Record<string, number>, curr: any) => {
          acc[curr.department || 'Unassigned'] = curr.total_cost;
          return acc;
        }, {}),
        monthlyTrend: monthlyData
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
}