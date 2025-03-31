import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import pool from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { gross_salary, employee_id } = req.body;

    // Recupera i parametri fiscali correnti
    const [taxParams] = await pool.query(
      'SELECT * FROM tax_parameters WHERE year = ? AND valid_to IS NULL',
      [new Date().getFullYear()]
    ) as [any[], any];

    // Calcolo contributi INPS (aliquota del 9.19% per i dipendenti)
    const inps_contribution = gross_salary * 0.0919;

    // Base imponibile IRPEF (reddito lordo - contributi INPS)
    const taxable_income = gross_salary - inps_contribution;

    // Calcolo IRPEF secondo gli scaglioni 2023
    let irpef_tax = 0;
    if (taxable_income <= 15000) {
      irpef_tax = taxable_income * 0.23;
    } else if (taxable_income <= 28000) {
      irpef_tax = 3450 + (taxable_income - 15000) * 0.25;
    } else if (taxable_income <= 50000) {
      irpef_tax = 6700 + (taxable_income - 28000) * 0.35;
    } else {
      irpef_tax = 14400 + (taxable_income - 50000) * 0.43;
    }

    // Calcolo addizionale regionale (esempio con aliquota media del 1.23%)
    const regional_tax = taxable_income * 0.0123;

    // Calcolo addizionale comunale (esempio con aliquota media dello 0.8%)
    const municipal_tax = taxable_income * 0.008;

    // Totale detrazioni (da implementare in base alle specifiche necessità)
    const total_deductions = 0;

    // Totale contributi
    const total_contributions = inps_contribution;

    // Calcolo netto
    const net_salary = gross_salary - (
      inps_contribution + 
      irpef_tax + 
      regional_tax + 
      municipal_tax
    );

    const calculations = {
      gross_salary,
      net_salary,
      total_deductions,
      total_contributions,
      inps_contribution,
      irpef_tax,
      regional_tax,
      municipal_tax
    };

    return res.status(200).json(calculations);
  } catch (error) {
    console.error('Failed to calculate taxes:', error);
    return res.status(500).json({ error: 'Failed to calculate taxes' });
  }
}