import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Environment Variables (.env)
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
    }
  });
}

async function testSMTP() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE === 'true' || true,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });

  try {
    console.log('Verificando conexão SMTP...');
    await transporter.verify();
    console.log('✅ Conexão SMTP autenticada com sucesso!');

    const senderEmail = process.env.SMTP_USER || 'suporte@finly.com';
    const info = await transporter.sendMail({
      from: `"Finly - Suporte & Segurança" <${senderEmail}>`,
      to: senderEmail,
      subject: 'Teste de Disparo de E-mail Finly',
      text: 'Se você recebeu este e-mail, o envio via SMTP está funcionando 100%!',
    });
    console.log('✅ E-mail de teste disparado com sucesso! ID:', info.messageId);
  } catch (error) {
    console.error('❌ Erro no teste SMTP:', error);
  }
}

testSMTP();
