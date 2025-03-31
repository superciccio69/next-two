import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import pool from '@/lib/db';
import PDFDocument from 'pdfkit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { id } = req.query;

  try {
    // Recupera i dati della busta paga
    const [rows] = await pool.query(
      `SELECT p.*, e.* 
       FROM payrolls p 
       JOIN employees e ON p.employee_id = e.id 
       WHERE p.id = ?`,
      [id]
    ) as [any[], any];

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Payroll not found' });
    }

    const payroll = rows[0];

    // Crea il PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    // Imposta gli header per il download del PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=busta-paga-${payroll.name}-${payroll.period_month}-${payroll.period_year}.pdf`);

    // Pipe il PDF alla response
    doc.pipe(res);

    // Aggiungi il contenuto al PDF
    doc
      .fontSize(20)
      .text('Busta Paga', { align: 'center' })
      .moveDown();

    doc
      .fontSize(12)
      .text(`Dipendente: ${payroll.name}`)
      .text(`Periodo: ${payroll.period_month}/${payroll.period_year}`)
      .moveDown();

    doc
      .text('Retribuzione Lorda:', { continued: true })
      .text(`€ ${payroll.gross_salary.toFixed(2)}`, { align: 'right' })
      .moveDown();

    // Trattenute
    doc
      .text('Trattenute:')
      .moveDown(0.5);

    doc
      .text('INPS:', { continued: true })
      .text(`€ ${payroll.inps_contribution.toFixed(2)}`, { align: 'right' });

    doc
      .text('IRPEF:', { continued: true })
      .text(`€ ${payroll.irpef_tax.toFixed(2)}`, { align: 'right' });

    doc
      .text('Addizionale Regionale:', { continued: true })
      .text(`€ ${payroll.regional_tax.toFixed(2)}`, { align: 'right' });

    doc
      .text('Addizionale Comunale:', { continued: true })
      .text(`€ ${payroll.municipal_tax.toFixed(2)}`, { align: 'right' })
      .moveDown();

    // Totale netto
    doc
      .fontSize(14)
      .text('Retribuzione Netta:', { continued: true })
      .text(`€ ${payroll.net_salary.toFixed(2)}`, { align: 'right' });

    // Finalizza il PDF
    doc.end();
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    return res.status(500).json({ error: 'Failed to generate PDF' });
  }
}