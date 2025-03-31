import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const logFile = path.join(process.cwd(), 'logs', 'retry-process.log');

    const fileContent = await fs.readFile(logFile, 'utf-8');
    const logs = fileContent.trim().split('\n').reverse();
    
    const totalPages = Math.ceil(logs.length / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedLogs = logs.slice(startIndex, endIndex);

    res.status(200).json({
      logs: paginatedLogs,
      totalPages,
      currentPage: page,
      totalLogs: logs.length
    });
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      return res.status(200).json({
        logs: [],
        totalPages: 0,
        currentPage: 1,
        totalLogs: 0
      });
    }
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
}