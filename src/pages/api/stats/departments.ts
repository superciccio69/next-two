import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      // Mock data for demonstration
      return res.status(200).json([
        { name: 'Amministrazione', employeeCount: 8, attendanceRate: 95 },
        { name: 'Sviluppo', employeeCount: 12, attendanceRate: 88 },
        { name: 'Marketing', employeeCount: 6, attendanceRate: 92 },
        { name: 'Vendite', employeeCount: 10, attendanceRate: 85 },
        { name: 'Supporto', employeeCount: 6, attendanceRate: 90 }
      ]);
    } catch (error: any) {
      console.error('Failed to fetch department stats:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch department statistics',
        details: error.message 
      });
    }
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}