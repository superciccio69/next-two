import { NextApiRequest, NextApiResponse } from 'next';
import PDFDocument from 'pdfkit';
import pool from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { id } = req.query;
    const [payrollRecords] = await pool.query(
      `SELECT p.*, e.name, e.email, e.department, e.role
       FROM payrolls p
       JOIN employees e ON p.employee_id = e.id
       WHERE p.id = ?`,
      [id]
    ) as [any[], any];

    if (!payrollRecords.length) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }

    const record = payrollRecords[0];

    // Create PDF document
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payslip-${record.name}-${record.month}-${record.year}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add company logo/header
    doc.fontSize(20).text('Company Name', { align: 'center' });
    doc.fontSize(16).text('Pay Slip', { align: 'center' });
    doc.moveDown();

    // Employee details
    doc.fontSize(12);
    doc.text(`Employee Name: ${record.name}`);
    doc.text(`Department: ${record.department}`);
    doc.text(`Role: ${record.role}`);
    doc.text(`Period: ${record.month}/${record.year}`);
    doc.moveDown();

    // Salary details
    doc.fontSize(14).text('Earnings', { underline: true });
    doc.fontSize(12);
    doc.text(`Base Salary: €${record.base_salary.toFixed(2)}`);
    doc.text(`Overtime: €${record.overtime.toFixed(2)}`);
    doc.moveDown();

    doc.fontSize(14).text('Deductions', { underline: true });
    doc.fontSize(12);
    doc.text(`Tax and Other Deductions: €${record.deductions.toFixed(2)}`);
    doc.moveDown();

    // Total
    doc.fontSize(14);
    doc.text(`Net Salary: €${record.net_salary.toFixed(2)}`, { underline: true });
    doc.moveDown();

    // Footer
    doc.fontSize(10);
    doc.text('This is a computer-generated document and does not require a signature.', { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });

    // Finalize PDF
    doc.end();
  } catch (error) {
    // If headers haven't been sent, send error response
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate payslip' });
    }
  }
}