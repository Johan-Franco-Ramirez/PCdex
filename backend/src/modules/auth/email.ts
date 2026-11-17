import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors.js';

export async function enviarCodigoCorreo(email: string, codigo: string): Promise<void> {
 if (!env.SMTP_USER || !env.SMTP_PASSWORD) {
  throw new AppError(503, 'CORREO_NO_CONFIGURADO', 'El envío de correo aún no está configurado.');
 }
 const transport = nodemailer.createTransport({
  host: env.SMTP_HOST, port: env.SMTP_PORT, secure: env.SMTP_SECURE, requireTLS: !env.SMTP_SECURE,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
  connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
 });
 try {
  await transport.sendMail({
   from: env.SMTP_USER, to: email, subject: 'Código de verificación de PCdex',
   text: `Tu código de verificación de PCdex es:\n\n${codigo}\n\nCaduca en 15 minutos. No lo compartas. Si no solicitaste este código, ignora este correo.`,
  });
 } finally { transport.close(); }
}
