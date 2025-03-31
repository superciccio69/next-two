import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendPayslipEmail(
  recipientEmail: string,
  employeeName: string,
  month: string,
  year: number,
  pdfBuffer: Buffer
) {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'payroll@company.com',
    to: recipientEmail,
    subject: `Payslip for ${month} ${year}`,
    text: `Dear ${employeeName},\n\nPlease find attached your payslip for ${month} ${year}.\n\nBest regards,\nHR Department`,
    attachments: [{
      filename: `payslip-${month}-${year}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf'
    }]
  };

  await transporter.sendMail(mailOptions);
}