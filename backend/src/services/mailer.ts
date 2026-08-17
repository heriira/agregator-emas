import nodemailer from "nodemailer";

/* Detail config SMTP dimasukan kedalam file .env */
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
  throw new Error("Konfigurasi SMTP belum lengkap di environment variables (.env)");
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: Number(SMTP_PORT) === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

interface SendMailInput {
  to: string;
  subject: string;
  text: string;
}

export async function sendMail({ to, subject, text }: SendMailInput): Promise<void> {
  await transporter.sendMail({
    from: `"Agregator Emas" <${SMTP_USER}>`,
    to,
    subject,
    text,
  });
}
