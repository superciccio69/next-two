import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface SummaryData extends RowDataPacket {
  totalEmployees: number;
  activeEmployees: number;
  averageAttendance: number;
  totalHoursWorked: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const period = req.query.period || 'month';
    let dateFilter = '';
    
    switch(period) {
      case 'week':
        dateFilter = 'AND a.attendance_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        break;
      case 'month':
        dateFilter = 'AND a.attendance_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
        break;
      case 'year':
        dateFilter = 'AND a.attendance_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';
        break;
      default:
        dateFilter = 'AND a.attendance_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    }

    try {
      // For demo purposes, we'll return mock data
      // In a real app, you would query your database
      
      // Example query (commented out):
      /*
      const [results] = await pool.query<SummaryData[]>(`
        SELECT 
          (SELECT COUNT(*) FROM employees) as totalEmployees,
          (SELECT COUNT(*) FROM employees WHERE status = 'active') as activeEmployees,
          (SELECT 
            ROUND(
              (COUNT(CASE WHEN status = 'present' THEN 1 END) * 100.0) / COUNT(*), 
              1
            ) 
          FROM attendance a 
          WHERE 1=1 ${dateFilter}
          ) as averageAttendance,
          (SELECT 
            COALESCE(SUM(
              TIMESTAMPDIFF(HOUR, check_in, IFNULL(check_out, NOW()))
            ), 0) 
          FROM attendance a 
          WHERE status = 'present' ${dateFilter}
          ) as totalHoursWorked
      `);
      
      return res.status(200).json(results[0]);
      */
      
      // Mock data for demonstration
      return res.status(200).json({
        totalEmployees: 42,
        activeEmployees: 38,
        averageAttendance: 92.5,
        totalHoursWorked: 1240
      });
    } catch (error: any) {
      console.error('Failed to fetch summary stats:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch summary statistics',
        details: error.message 
      });
    }
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}