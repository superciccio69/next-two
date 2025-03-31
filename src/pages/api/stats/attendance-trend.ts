import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const period = req.query.period || 'month';
    let days = 30;
    
    switch(period) {
      case 'week':
        days = 7;
        break;
      case 'month':
        days = 30;
        break;
      case 'year':
        days = 12; // We'll return monthly data for year view
        break;
    }

    try {
      // Generate mock data for the trend
      const trendData = [];
      const today = new Date();
      
      if (period === 'year') {
        // Monthly data for year view
        for (let i = 0; i < days; i++) {
          const date = new Date(today);
          date.setMonth(today.getMonth() - i);
          
          trendData.unshift({
            date: date.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' }),
            present: Math.floor(Math.random() * 20) + 25,
            absent: Math.floor(Math.random() * 5) + 1,
            late: Math.floor(Math.random() * 8) + 2
          });
        }
      } else {
        // Daily data for week/month view
        for (let i = 0; i < days; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          
          trendData.unshift({
            date: date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
            present: Math.floor(Math.random() * 10) + 30,
            absent: Math.floor(Math.random() * 5) + 1,
            late: Math.floor(Math.random() * 8) + 2
          });
        }
      }
      
      return res.status(200).json(trendData);
    } catch (error: any) {
      console.error('Failed to fetch attendance trend:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch attendance trend',
        details: error.message 
      });
    }
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}