import { hash } from 'bcrypt';
import pool from '@/lib/db';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const hashedPassword = await hash('password123', 10);
    
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES (?, ?, ?, ?)`,
      ['Admin User', 'admin@example.com', hashedPassword, 'ADMIN']
    );

    console.log('Query result:', result);
    res.status(200).json({ message: 'Test user created successfully' });
  } catch (error) {
    console.error('Detailed error:', error);
    res.status(500).json({ 
      error: 'Failed to create test user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}