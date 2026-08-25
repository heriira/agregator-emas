import fs from "fs";
import path from "path";
import { Resend } from "resend";

/**
 * Railway memblokir koneksi SMTP langsung (port 587 & 465). Resend memakai HTTP API sehingga tidak terkena blokir tersebut. Detail config diambil dari .env.
 */
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM;

if (!RESEND_API_KEY || !RESEND_FROM) {
  throw new Error("Konfigurasi Resend belum lengkap di environment variables (.env)");
}

export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@heriirawan.space";

const resend = new Resend(RESEND_API_KEY);

/**
 * Membaca file template HTML di src/templates/<templateName>.html lalu mengganti setiap placeholder "{{namaVariabel}}" dengan nilai dari `variables`.
 *
 * path.join(__dirname, ...) dipakai (bukan process.cwd()) supaya path tetap benar
 * baik saat dijalankan via ts-node dari src/, maupun setelah di-compile ke dist/
 */
export function renderTemplate(templateName: string, variables: Record<string, string>): string {
  const templatePath = path.join(__dirname, "../templates", `${templateName}.html`);
  const template = fs.readFileSync(templatePath, "utf-8");

  return template.replace(/{{\s*(\w+)\s*}}/g, (match, key: string) => {
    return Object.prototype.hasOwnProperty.call(variables, key) ? variables[key]! : match;
  });
}

interface SendMailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: SendMailInput): Promise<void> {
  const { error } = await resend.emails.send({
    from: `Agregator Emas <${RESEND_FROM}>`,
    to,
    subject,
    html,
  });
  if (error) {
    throw new Error(`Gagal mengirim email via Resend: ${error.message}`);
  }
}
