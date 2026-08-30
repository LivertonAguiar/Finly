import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

const DATA_DIR = path.join(__dirname, 'data');
const STORES_DIR = path.join(DATA_DIR, 'stores');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(STORES_DIR)) fs.mkdirSync(STORES_DIR, { recursive: true });

// Initial Users Database Setup
if (!fs.existsSync(USERS_FILE)) {
  const initialUsers = [
    {
      id: 'usr-default-liverton',
      name: 'Liverton',
      email: 'liverton.aguiar@hotmail.com',
      password: '123',
      phone: '85985949115',
      role: 'admin',
      createdAt: '2026-01-01',
    }
  ];
  fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2), 'utf8');
}

// Helpers for User Store
const getUserStorePath = (userId) => {
  const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(STORES_DIR, `${safeId}.json`);
};

const getUsers = () => {
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
};

const saveUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
};

// Gmail SMTP Transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'liverton.aguiar.sup@gmail.com',
    pass: 'egrfpnplrnbuykev',
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

// 1. AUTH: LOGIN
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'E-mail é obrigatório.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const users = getUsers();
  let user = users.find(u => u.email.toLowerCase() === cleanEmail);

  // If user does not exist but is liverton, initialize it
  if (!user && (cleanEmail === 'liverton.aguiar@hotmail.com' || cleanEmail.includes('liverton'))) {
    user = {
      id: 'usr-default-liverton',
      name: 'Liverton',
      email: cleanEmail,
      password: password || '123',
      role: 'admin',
      createdAt: new Date().toISOString().split('T')[0],
    };
    users.unshift(user);
    saveUsers(users);
  }

  if (!user) {
    return res.status(404).json({ success: false, message: 'Usuário não encontrado. Cadastre-se para continuar.' });
  }

  // Update password if initial '123'
  if (password && user.password === '123' && password !== '123') {
    user.password = password;
    saveUsers(users);
  } else if (password && user.password && user.password !== password) {
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

// 2. AUTH: REGISTER
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Nome e e-mail são obrigatórios.' });
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
    password: password || '123',
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

  const mailOptions = {
    from: '"PlannerFin - Suporte & Segurança" <liverton.aguiar.sup@gmail.com>',
    to: email,
    subject: `Seu código de recuperação PlannerFin: ${code}`,
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 PlannerFin API Server rodando na porta ${PORT} (http://localhost:${PORT})`);
});
