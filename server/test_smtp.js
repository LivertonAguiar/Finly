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
  const smtpUser = process.env.SMTP_USER;
  if (!smtpUser) {
    console.error('❌ SMTP_USER não configurado no .env!');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE === 'true' || true,
    auth: {
      user: smtpUser,
      pass: process.env.SMTP_PASS || '',
    },
  });

  try {
    console.log(`Verificando conexão e credenciais SMTP para ${smtpUser}...`);
    await transporter.verify();
    console.log('✅ Conexão SMTP autenticada com sucesso! Nenhuma mensagem de teste enviada (prevenção de spam/bounce).');

    // Disparo real somente sob demanda explícita com flag --send e exclusivamente para o próprio remetente
    if (process.argv.includes('--send')) {
      console.log(`Disparando e-mail de teste seguro exclusivamente para a própria conta: ${smtpUser}...`);
      const info = await transporter.sendMail({
        from: `"Finly" <${smtpUser}>`,
        to: smtpUser,
        subject: 'Teste Seguro de SMTP - Finly',
        text: 'Se você recebeu este e-mail, o envio via SMTP está funcionando 100%!',
      });
      console.log('✅ E-mail de teste disparado com sucesso! ID:', info.messageId);
    }
  } catch (error) {
    console.error('❌ Erro no teste SMTP:', error);
  }
}

testSMTP();
