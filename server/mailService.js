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

  const cleanEmail = email.toLowerCase().trim();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const now = Date.now();
  const expiresAt = now + 15 * 60 * 1000;

  const existing = verificationCodes.get(cleanEmail);
  const activeCodes = (existing?.codes || [])
    .filter(c => c.expiresAt > now)
    .slice(0, 4);

  activeCodes.unshift({ code, expiresAt });

  verificationCodes.set(cleanEmail, {
    codes: activeCodes,
    attempts: 0,
  });

  const senderEmail = process.env.SMTP_USER || 'suporte@finly.com';
  const mailOptions = {
    from: `"Finly - Segurança & Acesso" <${senderEmail}>`,
    to: cleanEmail,
    subject: `Seu código de verificação Finly: ${code}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 36px 28px; background-color: #121215; border-radius: 28px; color: #f8fafc; border: 1px solid #27272a; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
        <!-- Header with Finly Logo -->
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #6366f1, #7c3aed, #a855f7); color: #ffffff; width: 52px; height: 52px; border-radius: 18px; font-size: 28px; font-weight: 900; line-height: 52px; text-align: center; box-shadow: 0 8px 24px rgba(124, 58, 237, 0.35);">F</div>
          <h2 style="color: #ffffff; font-size: 24px; font-weight: 900; margin: 14px 0 4px 0; letter-spacing: -0.5px;">Fin<span style="color: #a78bfa;">ly</span></h2>
          <p style="color: #a1a1aa; font-size: 13px; margin: 0; font-weight: 500;">Segurança & Gestão Financeira Inteligente</p>
        </div>

        <!-- Code Box -->
        <div style="background: linear-gradient(135deg, rgba(124,58,237,0.15), rgba(168,85,247,0.06)); border: 1px solid rgba(168,85,247,0.35); border-radius: 20px; padding: 26px 20px; text-align: center; margin-bottom: 24px;">
          <p style="font-size: 11px; color: #c084fc; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 10px 0;">SEU CÓDIGO DE VERIFICAÇÃO:</p>
          <div style="display: inline-block; font-size: 38px; font-weight: 900; letter-spacing: 6px; color: #ffffff; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; text-shadow: 0 2px 10px rgba(124,58,237,0.5); user-select: all; -webkit-user-select: all; padding: 6px 16px; background: rgba(0,0,0,0.35); border-radius: 14px;">${code}</div>
          <p style="font-size: 11px; color: #71717a; margin: 12px 0 0 0;">⏱️ Válido por 15 minutos</p>
        </div>

        <!-- Message Body -->
        <p style="font-size: 13px; color: #d4d4d8; line-height: 1.6; margin-bottom: 24px; text-align: center;">
          Você solicitou a alteração de senha da sua conta <strong>Finly</strong>. Digite o código de 6 dígitos no aplicativo para confirmar sua identidade e definir uma nova senha.
        </p>

        <!-- Security Footer -->
        <div style="border-top: 1px solid #27272a; padding-top: 18px; text-align: center;">
          <p style="font-size: 11px; color: #71717a; margin: 0; line-height: 1.5;">
            🛡️ Se você não realizou esta solicitação, desconsidere esta mensagem. Sua conta permanece 100% protegida.
          </p>
          <p style="font-size: 10px; color: #52525b; margin: 8px 0 0 0;">
            © Finly. Todos os direitos reservados.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Código de recuperação enviado para: ${cleanEmail}`);
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

  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = String(code).replace(/\D/g, '').trim();

  const record = verificationCodes.get(cleanEmail);
  const now = Date.now();
  if (!record || !record.codes || record.codes.length === 0) {
    verificationCodes.delete(cleanEmail);
    return res.status(400).json({ success: false, message: 'Nenhum código solicitado para este e-mail.' });
  }

  record.codes = record.codes.filter(c => c.expiresAt > now);
  if (record.codes.length === 0) {
    verificationCodes.delete(cleanEmail);
    return res.status(400).json({ success: false, message: 'Código expirado. Solicite um novo.' });
  }

  const matches = record.codes.some(c => String(c.code).replace(/\D/g, '').trim() === cleanCode);
  if (!matches) {
    return res.status(400).json({ success: false, message: 'Código incorreto.' });
  }

  return res.json({ success: true, message: 'Código validado com sucesso!' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Mail Service rodando na porta ${PORT}`);
});
