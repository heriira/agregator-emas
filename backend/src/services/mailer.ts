import { Resend } from "resend";

/**
 * Railway memblokir koneksi SMTP langsung (port 587 & 465), sehingga
 * Nodemailer tidak bisa dipakai di production. Resend memakai HTTP API
 * sehingga tidak terkena blokir tersebut. Detail config diambil dari .env.
 */
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM;

if (!RESEND_API_KEY || !RESEND_FROM) {
  throw new Error("Konfigurasi Resend belum lengkap di environment variables (.env)");
}

const resend = new Resend(RESEND_API_KEY);

interface SendMailInput {
  to: string;
  subject: string;
  text: string;
}

export async function sendMail({ to, subject, text }: SendMailInput): Promise<void> {
  const { error } = await resend.emails.send({
    from: `Agregator Emas <${RESEND_FROM}>`,
    to,
    subject,
    text,
  });
  if (error) {
    throw new Error(`Gagal mengirim email via Resend: ${error.message}`);
  }
}
