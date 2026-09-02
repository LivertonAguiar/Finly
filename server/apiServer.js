import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { hashPassword, verifyPassword, isHashed } from './security/crypto.js';

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
const PORT = process.env.PORT || 3001;

// Security & Parsing Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Hide Server Information
app.disable('x-powered-by');

// App Version & Update Endpoint
app.get('/api/app/version', (req, res) => {
  res.json({
    version: '1.1.2',
    buildDate: '2026-09-02',
    notes: 'Novidades da versão: Gesto Puxe para Atualizar (Pull-to-refresh), otimização da conta demo, tela cheia imersiva e central de atualizações na aba Sobre.',
    downloadUrl: 'https://github.com/LivertonAguiar/planner-financeiro/releases',
    isLatest: true,
  });
});

const DATA_DIR = path.join(__dirname, 'data');
const STORES_DIR = path.join(DATA_DIR, 'stores');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(STORES_DIR)) fs.mkdirSync(STORES_DIR, { recursive: true });

// Helpers for User Store
const getUserStorePath = (userId) => {
  const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(STORES_DIR, `${safeId}.json`);
};

const saveUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
};

const getUsers = () => {
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    const users = JSON.parse(raw);
    let upgraded = false;

    // Automatic Cryptographic Migration: ensure all stored passwords are salted and hashed
    const sanitized = users.map(u => {
      if (u.password && !isHashed(u.password)) {
        u.password = hashPassword(u.password);
        upgraded = true;
      }
      return u;
    });

    if (upgraded) {
      saveUsers(sanitized);
    }
    return sanitized;
  } catch (e) {
    return [];
  }
};

// Initial Users Database Setup (Securely Hashed)
if (!fs.existsSync(USERS_FILE)) {
  const initialUsers = [
    {
      id: 'usr-default-liverton',
      name: 'Liverton',
      email: 'liverton.aguiar@hotmail.com',
      password: hashPassword('123'),
      phone: '85985949115',
      role: 'admin',
      createdAt: '2026-01-01',
    },
    {
      id: 'usr-demo-financeiro',
      name: 'Conta Demonstração',
      email: 'demo@finly.com',
      password: hashPassword('demo'),
      phone: '11999998888',
      role: 'admin',
      createdAt: '2026-01-01',
    }
  ];
  saveUsers(initialUsers);
} else {
  // Ensure migration runs on startup
  getUsers();
}

// SMTP Transporter using Environment Variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: process.env.SMTP_SECURE === 'true' || true,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

const verificationCodes = new Map();

transporter.verify((error) => {
  if (error) {
    console.error('❌ Erro na conexão SMTP:', error.message);
  } else {
    console.log('✅ Servidor SMTP Gmail pronto para envio de e-mails!');
  }
});

// ============================================================================
// API ROUTES
// ============================================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// 1. AUTH: LOGIN (Cryptographic Verification)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'E-mail e senha são obrigatórios.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    return res.status(404).json({ success: false, message: 'Usuário não encontrado. Verifique seu e-mail ou cadastre-se.' });
  }

  // Cryptographic timing-safe password verification
  const isValid = verifyPassword(password, user.password);
  if (!isValid) {
    return res.status(401).json({ success: false, message: 'Senha incorreta.' });
  }

  // Check if store exists
  const storePath = getUserStorePath(user.id);
  let store = null;
  if (fs.existsSync(storePath)) {
    try {
      store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    } catch (e) {}
  }

  // Sanitize user object (never expose password hash)
  return res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    },
    store,
  });
});

// 2. AUTH: REGISTER (Hashed Salted Storage)
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Nome, e-mail e senha são obrigatórios.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const users = getUsers();
  const existing = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (existing) {
    return res.status(400).json({ success: false, message: 'Já existe um cadastro com este e-mail.' });
  }

  const newUser = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    email: cleanEmail,
    password: hashPassword(password),
    phone: phone ? phone.trim() : undefined,
    role: 'admin',
    createdAt: new Date().toISOString().split('T')[0],
  };

  users.push(newUser);
  saveUsers(users);

  return res.json({
    success: true,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      createdAt: newUser.createdAt,
    },
  });
});

// 2.1 AUTH: CHANGE PASSWORD (Hashed)
app.post('/api/auth/change-password', (req, res) => {
  const { email, oldPassword, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ success: false, message: 'E-mail e nova senha são obrigatórios.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
  }

  if (oldPassword && !verifyPassword(oldPassword, user.password)) {
    return res.status(401).json({ success: false, message: 'A senha atual informada está incorreta.' });
  }

  user.password = hashPassword(newPassword);
  saveUsers(users);

  return res.json({ success: true, message: 'Senha alterada com sucesso no servidor!' });
});

// 3. CONTINUOUS AUTO-SYNC: GET USER STORE
app.get('/api/user/store', (req, res) => {
  const userId = req.headers['x-user-id'] || req.query.userId;
  if (!userId) {
    return res.status(400).json({ success: false, message: 'x-user-id header obrigatório.' });
  }

  const storePath = getUserStorePath(userId);
  if (!fs.existsSync(storePath)) {
    return res.json({ success: true, store: null, message: 'Nenhum dado salvo no servidor ainda.' });
  }

  try {
    const raw = fs.readFileSync(storePath, 'utf8');
    const store = JSON.parse(raw);
    const stat = fs.statSync(storePath);
    return res.json({
      success: true,
      store,
      lastModified: stat.mtimeMs,
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Erro ao ler dados do servidor.' });
  }
});

// 4. CONTINUOUS AUTO-SYNC: SAVE / SYNC USER STORE (ATOMIC)
app.post('/api/user/store', (req, res) => {
  const userId = req.headers['x-user-id'] || req.body.userId;
  const { store } = req.body;

  if (!userId || !store) {
    return res.status(400).json({ success: false, message: 'userId e store são obrigatórios.' });
  }

  const storePath = getUserStorePath(userId);
  const tempPath = `${storePath}.tmp`;

  try {
    const payload = {
      ...store,
      _serverTimestamp: new Date().toISOString(),
    };

    // Atomic write
    fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2), 'utf8');
    fs.renameSync(tempPath, storePath);

    return res.json({
      success: true,
      message: 'Sincronizado com sucesso no servidor!',
      serverTimestamp: payload._serverTimestamp,
    });
  } catch (e) {
    console.error('❌ Erro ao sincronizar dados:', e);
    return res.status(500).json({ success: false, message: 'Erro ao salvar dados no servidor.' });
  }
});

// 5. MAIL RECOVERY
app.post('/api/send-recovery-code', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'E-mail é obrigatório.' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes.set(email.toLowerCase().trim(), {
    code,
    expiresAt: Date.now() + 15 * 60 * 1000,
  });

  const senderEmail = process.env.SMTP_USER || 'suporte@finly.com';
  const mailOptions = {
    from: `"Finly - Suporte & Segurança" <${senderEmail}>`,
    to: email,
    subject: `Seu código de recuperação Finly: ${code}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background-color: #0f172a; border-radius: 24px; color: #f8fafc; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background-color: #007a4d; color: #ffffff; width: 48px; height: 48px; border-radius: 16px; font-size: 26px; font-weight: 900; line-height: 48px; text-align: center;">P</div>
          <h2 style="color: #ffffff; font-size: 22px; font-weight: 900; margin: 12px 0 4px 0;">Planner<span style="color: #34d399;">Fin</span></h2>
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">Recuperação e Alteração de Senha</p>
        </div>
        <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="font-size: 11px; color: #34d399; font-weight: 800; text-transform: uppercase; margin: 0 0 10px 0;">SEU CÓDIGO DE SEGURANÇA:</p>
          <div style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #ffffff; font-family: monospace;">${code}</div>
          <p style="font-size: 11px; color: #64748b; margin: 10px 0 0 0;">Válido por 15 minutos</p>
        </div>
        <p style="font-size: 13px; color: #cbd5e1; line-height: 1.6;">
          Digite o código de 6 dígitos no aplicativo para continuar com a alteração da sua senha.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.json({ success: true, message: 'Código de verificação enviado para o seu e-mail!' });
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    return res.status(500).json({ success: false, message: 'Erro ao enviar e-mail via servidor SMTP.' });
  }
});

app.post('/api/verify-code', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, message: 'E-mail e código são obrigatórios.' });
  }

  const record = verificationCodes.get(email.toLowerCase().trim());
  if (!record || Date.now() > record.expiresAt || record.code !== code.trim()) {
    return res.status(400).json({ success: false, message: 'Código inválido ou expirado.' });
  }

  return res.json({ success: true, message: 'Código validado com sucesso!' });
});

app.post('/api/reset-password', (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ success: false, message: 'E-mail, código e nova senha são obrigatórios.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const record = verificationCodes.get(cleanEmail);
  if (!record || Date.now() > record.expiresAt || record.code !== code.trim()) {
    return res.status(400).json({ success: false, message: 'Código de verificação inválido ou expirado.' });
  }

  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === cleanEmail);
  if (!user) {
    return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
  }

  user.password = hashPassword(newPassword);
  saveUsers(users);
  verificationCodes.delete(cleanEmail);

  return res.json({ success: true, message: 'Senha redefinida com sucesso!' });
});

// Serve static frontend in production if dist exists
const DIST_DIR = path.join(__dirname, '../dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(DIST_DIR, 'index.html'));
    }
    next();
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Finly API & Web Server rodando na porta ${PORT} (http://localhost:${PORT})`);
});
