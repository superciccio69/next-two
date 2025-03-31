import { NextApiRequest, NextApiResponse } from 'next';
import PDFDocument from 'pdfkit';
import { sendPayslipEmail } from '@/utils/emailService';
import { createPool } from 'mysql2/promise';

const pool = createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { id } = req.query;
    const [payrollRecords] = await pool.query(
      `SELECT p.*, e.name, e.email, e.department, e.role
       FROM payroll p
       JOIN employees e ON p.employee_id = e.id
       WHERE p.id = ?`,
      [id]
    ) as [any[], any];

    if (!payrollRecords.length) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }

    const record = payrollRecords[0];

    // Generate PDF
    const pdfBuffer: Buffer[] = [];
    const doc = new PDFDocument();
    doc.on('data', pdfBuffer.push.bind(pdfBuffer));
    
    // Add PDF content (same as in payslip.ts)
    doc.fontSize(20).text('Company Name', { align: 'center' });
    // ... rest of PDF generation code ...

    doc.end();

    // Convert PDF chunks to Buffer
    const pdf = Buffer.concat(pdfBuffer);

    // Send email
    const monthName = new Date(0, record.month - 1).toLocaleString('default', { month: 'long' });
    await sendPayslipEmail(
      record.email,
      record.name,
      monthName,
      record.year,
      pdf
    );

    res.status(200).json({ message: 'Payslip sent successfully' });
  } catch (error) {
    console.error('Failed to send payslip:', error);
    res.status(500).json({ error: 'Failed to send payslip' });
  }
}