import express from 'express';
import cors from 'cors';
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

const app = express();
app.use(cors());
app.use(express.json());

// Transporter configuration with Environment Variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: process.env.SMTP_SECURE === 'true' || true,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

// In-memory verification codes cache with 15min expiry
const verificationCodes = new Map();

// Verify SMTP connection on start
transporter.verify((error) => {
  if (error) {
    console.error('❌ Erro na conexão SMTP:', error);
  } else {
    console.log('✅ Servidor SMTP Gmail pronto para envio de e-mails!');
  }
});

// POST /api/send-recovery-code
app.post('/api/send-recovery-code', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'E-mail é obrigatório.' });
  }

  // Generate 6-digit verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes.set(email.toLowerCase().trim(), {
    code,
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
  });

  const senderEmail = process.env.SMTP_USER || 'suporte@finly.com';
  const mailOptions = {
    from: `"Finly - Suporte & Segurança" <${senderEmail}>`,
    to: email,
    subject: `Seu código de recuperação Finly: ${code}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background-color: #0f172a; border-radius: 24px; color: #f8fafc; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background-color: #007a4d; color: #ffffff; width: 48px; height: 48px; border-radius: 16px; font-size: 26px; font-weight: 900; line-height: 48px; text-align: center;">P</div>
          <h2 style="color: #ffffff; font-size: 22px; font-weight: 900; margin: 12px 0 4px 0; letter-spacing: -0.5px;">Planner<span style="color: #34d399;">Fin</span></h2>
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">Recuperação e Alteração de Senha</p>
        </div>

        <div style="background: linear-gradient(135deg, rgba(0,122,77,0.15), rgba(16,185,129,0.05)); border: 1px solid rgba(16,185,129,0.3); border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="font-size: 11px; color: #34d399; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">SEU CÓDIGO DE SEGURANÇA:</p>
          <div style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #ffffff; font-family: monospace;">${code}</div>
          <p style="font-size: 11px; color: #64748b; margin: 10px 0 0 0;">Válido por 15 minutos</p>
        </div>

        <p style="font-size: 13px; color: #cbd5e1; line-height: 1.6; margin-bottom: 20px;">
          Você solicitou a alteração de senha da sua conta Finly. Digite o código de 6 dígitos no aplicativo para continuar.
        </p>

        <div style="border-top: 1px solid #1e293b; padding-top: 16px; text-align: center;">
          <p style="font-size: 11px; color: #64748b; margin: 0;">
            Se você não solicitou esta alteração, ignore este e-mail com segurança.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Código de recuperação enviado para: ${email}`);
    return res.json({ success: true, message: 'Código de verificação enviado com sucesso!' });
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail:', error);
    return res.status(500).json({ success: false, message: 'Erro ao enviar e-mail de recuperação.' });
  }
});

// POST /api/verify-code
app.post('/api/verify-code', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, message: 'E-mail e código são obrigatórios.' });
  }

  const record = verificationCodes.get(email.toLowerCase().trim());
  if (!record) {
    return res.status(400).json({ success: false, message: 'Nenhum código solicitado para este e-mail.' });
  }

  if (Date.now() > record.expiresAt) {
    verificationCodes.delete(email.toLowerCase().trim());
    return res.status(400).json({ success: false, message: 'Código expirado. Solicite um novo.' });
  }

  if (record.code !== code.trim()) {
    return res.status(400).json({ success: false, message: 'Código incorreto.' });
  }

  return res.json({ success: true, message: 'Código validado com sucesso!' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Mail Service rodando na porta ${PORT}`);
});
