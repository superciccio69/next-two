import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendEmail({ subject, text }: { subject: string; text: string }) {
  return transporter.sendMail({
    from: process.env.SMTP_FROM_ADDRESS,
    to: process.env.DEFAULT_NOTIFICATION_EMAIL,
    subject,
    text,
  });
}