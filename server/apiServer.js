import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import { hashPassword, verifyPassword, isHashed } from './security/crypto.js';
import { generateSessionToken, verifySessionToken } from './security/token.js';

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
const APP_SECRET = process.env.APP_SECRET || 'finly_super_secure_vault_secret_2026_k9x2';

// Supabase Admin Client for account & password synchronization
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://finly.lpaguiar.com.br';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabaseAdmin = null;

if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  try {
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    console.log('🛡️ Supabase Admin SDK inicializado para sincronização de contas.');
  } catch (err) {
    console.warn('⚠️ Falha ao inicializar Supabase Admin SDK:', err.message);
  }
}

// 1. HTTP Security Headers (OWASP Hardening)
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
});

// 2. Strict CORS Configuration
const allowedOrigins = [
  'https://finly.lpaguiar.com.br',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'capacitor://localhost',
  'http://localhost',
  'https://localhost',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests without Origin (native mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origem não permitida por política de segurança CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-auth-token'],
}));

// Body parser with 20MB limit
app.use(express.json({ limit: '20mb' }));

// Audit & Debug Request Logger
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    const timestamp = new Date().toISOString();
    const sanitizedBody = req.body ? { ...req.body } : {};
    if (sanitizedBody.password) sanitizedBody.password = '***';
    if (sanitizedBody.newPassword) sanitizedBody.newPassword = '***';
    if (sanitizedBody.oldPassword) sanitizedBody.oldPassword = '***';
    console.log(`[${timestamp}] [HTTP ${req.method}] ${req.path} - IP: ${req.ip} - Body:`, JSON.stringify(sanitizedBody));
  }
  next();
});

// 3. Lightweight In-Memory Rate Limiting (Anti-Brute Force & Anti-DoS)
const rateLimitMap = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 10 * 60 * 1000);

const createRateLimiter = (options) => {
  const { windowMs, max, message, prefix = 'rl' } = options;
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const key = `${prefix}:${ip}`;
    const now = Date.now();

    const record = rateLimitMap.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    record.count++;
    rateLimitMap.set(key, record);

    if (record.count > max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        success: false,
        message: message || `Muitas tentativas. Tente novamente em ${retryAfter} segundos.`,
      });
    }

    next();
  };
};

const loginLimiter = createRateLimiter({
  prefix: 'login',
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15,
  message: 'Muitas tentativas de login. Por favor, aguarde alguns minutos antes de tentar novamente.',
});

const recoveryLimiter = createRateLimiter({
  prefix: 'recovery',
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Limite de solicitações de recuperação atingido. Tente novamente em 15 minutos.',
});

// 4. Token Authentication Middleware (Closes BOLA / IDOR)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.startsWith('Bearer '))
    ? authHeader.slice(7).trim()
    : req.headers['x-auth-token'];

  if (!token) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Acesso negado: Token de autenticação ausente. Faça login novamente.',
    });
  }

  const verification = verifySessionToken(token, APP_SECRET);
  if (!verification.valid || !verification.payload) {
    return res.status(401).json({
      success: false,
      code: 'TOKEN_INVALID_OR_EXPIRED',
      message: `Sessão inválida ou expirada (${verification.error || 'Token não autorizado'}). Faça login novamente.`,
    });
  }

  req.user = verification.payload;
  next();
};

// App Version & Update Endpoint (Dynamic Single Source of Truth)
const VERSION_FILE = path.join(__dirname, 'data/version.json');
const PKG_FILE = path.join(__dirname, '../package.json');

const getAppVersionInfo = () => {
  try {
    if (fs.existsSync(VERSION_FILE)) {
      return JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
    }
  } catch (_) {}

  let fallbackVer = '1.1.37';
  try {
    if (fs.existsSync(PKG_FILE)) {
      const pkg = JSON.parse(fs.readFileSync(PKG_FILE, 'utf8'));
      if (pkg.version) fallbackVer = pkg.version;
    }
  } catch (_) {}

  return {
    version: fallbackVer,
    latestVersion: fallbackVer,
    releaseDate: '2026-09-08',
    notes: `Novidades da v${fallbackVer}: Blindagem de segurança e melhorias de performance.`,
    downloadUrl: 'https://github.com/LivertonAguiar/Finly/releases/latest',
    isLatest: true,
  };
};

app.get('/api/app/version', (req, res) => {
  res.json(getAppVersionInfo());
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

// User Resolution Helper (Exact email, aliases, and cross-mapping)
const findUserByEmail = (email) => {
  if (!email || typeof email !== 'string') return null;
  const clean = email.trim().toLowerCase();
  const users = getUsers();

  // 1. Direct email match
  let user = users.find(u => u.email && u.email.trim().toLowerCase() === clean);
  if (user) return user;

  // 2. Alias match
  user = users.find(u => {
    if (Array.isArray(u.aliases)) {
      return u.aliases.some(a => typeof a === 'string' && a.trim().toLowerCase() === clean);
    }
    return false;
  });
  if (user) return user;

  // 3. Liverton fallback (interoperability between Hotmail and Gmail)
  if (clean === 'liverton.aguiar.sup@gmail.com' || clean === 'liverton.aguiar@hotmail.com') {
    user = users.find(u => u.id === 'usr-default-liverton');
    if (user) return user;
  }

  return null;
};

// Persistent Verification Codes Storage (survives container restarts & VPS deploys)
const VERIFICATION_CODES_FILE = path.join(DATA_DIR, 'verificationCodes.json');

const loadVerificationCodes = () => {
  try {
    if (fs.existsSync(VERIFICATION_CODES_FILE)) {
      const raw = fs.readFileSync(VERIFICATION_CODES_FILE, 'utf8');
      const data = JSON.parse(raw);
      const now = Date.now();
      const cleaned = {};
      for (const [emailKey, record] of Object.entries(data)) {
        if (record && Array.isArray(record.codes)) {
          const activeCodes = record.codes.filter(c => c && c.expiresAt > now);
          if (activeCodes.length > 0) {
            cleaned[emailKey] = {
              ...record,
              codes: activeCodes,
            };
          }
        }
      }
      return cleaned;
    }
  } catch (e) {
    console.error('⚠️ Erro ao ler verificationCodes.json:', e.message);
  }
  return {};
};

const saveVerificationCodes = (codesObj) => {
  try {
    const tempPath = `${VERIFICATION_CODES_FILE}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(codesObj, null, 2), 'utf8');
    fs.renameSync(tempPath, VERIFICATION_CODES_FILE);
  } catch (e) {
    console.error('❌ Erro ao salvar verificationCodes.json:', e.message);
  }
};

// Initial Users Database Setup
if (!fs.existsSync(USERS_FILE)) {
  const initialUsers = [
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

// 1. AUTH: LOGIN (Cryptographic Verification + Token Issuance)
app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'E-mail e senha são obrigatórios.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = findUserByEmail(cleanEmail);

  if (!user) {
    return res.status(404).json({ success: false, message: 'Usuário não encontrado. Verifique seu e-mail ou cadastre-se.' });
  }

  // Cryptographic timing-safe password verification
  const isValid = verifyPassword(password, user.password);
  if (!isValid) {
    return res.status(401).json({ success: false, message: 'Senha incorreta.' });
  }

  // Generate cryptographic session token (valid for 30 days)
  const token = generateSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role || 'member',
  }, APP_SECRET);

  // Check if store exists
  const storePath = getUserStorePath(user.id);
  let store = null;
  if (fs.existsSync(storePath)) {
    try {
      store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    } catch (e) {}
  }

  // Asynchronously ensure Supabase Auth has the same password if user logged in successfully
  if (supabaseAdmin) {
    (async () => {
      try {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const sbUser = listData?.users?.find(u => u.email?.toLowerCase() === cleanEmail);
        if (sbUser) {
          await supabaseAdmin.auth.admin.updateUserById(sbUser.id, { password });
        } else {
          await supabaseAdmin.auth.admin.createUser({
            email: cleanEmail,
            password,
            email_confirm: true,
            user_metadata: { name: user.name, role: user.role, phone: user.phone },
          });
        }
      } catch (_) {}
    })();
  }

  // Sanitize user object (never expose password hash)
  return res.json({
    success: true,
    token,
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

// 2. AUTH: REGISTER (Hashed Salted Storage + Token Issuance)
app.post('/api/auth/register', loginLimiter, (req, res) => {
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

  // Generate cryptographic session token
  const token = generateSessionToken({
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role,
  }, APP_SECRET);

  // Asynchronously synchronize with Supabase Auth
  if (supabaseAdmin) {
    (async () => {
      try {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const sbUser = listData?.users?.find(u => u.email?.toLowerCase() === cleanEmail);
        if (!sbUser) {
          await supabaseAdmin.auth.admin.createUser({
            email: cleanEmail,
            password,
            email_confirm: true,
            user_metadata: { name: newUser.name, role: newUser.role, phone: newUser.phone },
          });
          console.log(`[AUTH] Novo usuário sincronizado no Supabase Auth: ${cleanEmail}`);
        }
      } catch (err) {
        console.warn('⚠️ Falha ao sincronizar novo usuário no Supabase:', err.message);
      }
    })();
  }

  return res.json({
    success: true,
    token,
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

// 2.1 AUTH: CHANGE PASSWORD (Protected by Token)
app.post('/api/auth/change-password', authenticateToken, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!newPassword) {
    return res.status(400).json({ success: false, message: 'Nova senha é obrigatória.' });
  }

  const users = getUsers();
  const user = users.find(u => u.id === req.user.userId);

  if (!user) {
    return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
  }

  if (oldPassword && !verifyPassword(oldPassword, user.password)) {
    return res.status(401).json({ success: false, message: 'A senha atual informada está incorreta.' });
  }

  user.password = hashPassword(newPassword);
  saveUsers(users);

  // Asynchronously synchronize with Supabase Auth
  if (supabaseAdmin) {
    (async () => {
      try {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const sbUser = listData?.users?.find(u => u.email?.toLowerCase() === user.email.toLowerCase());
        if (sbUser) {
          await supabaseAdmin.auth.admin.updateUserById(sbUser.id, { password: newPassword });
          console.log(`[AUTH] Senha alterada sincronizada no Supabase Auth para: ${user.email}`);
        }
      } catch (err) {
        console.warn('⚠️ Falha ao sincronizar alteração de senha no Supabase:', err.message);
      }
    })();
  }

  return res.json({ success: true, message: 'Senha alterada com sucesso no servidor!' });
});

// 3. CONTINUOUS AUTO-SYNC: GET USER STORE (PROTECTED AGAINST BOLA / IDOR)
app.get('/api/user/store', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  if (!userId) {
    return res.status(400).json({ success: false, message: 'Identificador de usuário ausente no token.' });
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

// 4. CONTINUOUS AUTO-SYNC: SAVE / SYNC USER STORE (PROTECTED & ATOMIC)
app.post('/api/user/store', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { store } = req.body;

  if (!userId || !store) {
    return res.status(400).json({ success: false, message: 'Dados da store são obrigatórios.' });
  }

  const storePath = getUserStorePath(userId);
  const tempPath = `${storePath}.tmp`;

  try {
    const payload = {
      ...store,
      _serverTimestamp: new Date().toISOString(),
    };

    // Atomic write to prevent file corruption
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

// 4.1 RESET / DELETE USER STORE (Clean slate on disk + Supabase purge)
app.delete('/api/user/store', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  if (!userId) {
    return res.status(400).json({ success: false, message: 'Identificador de usuário ausente.' });
  }

  const storePath = getUserStorePath(userId);
  const tempPath = `${storePath}.tmp`;

  try {
    const cleanPayload = {
      accounts: [
        {
          id: 'acc-carteira-padrao',
          name: 'Carteira',
          type: 'cash',
          balance: 0,
          initialBalance: 0,
          institution: 'Carteira',
          color: '#10b981',
          includeInTotal: true,
        },
      ],
      cards: [],
      categories: [],
      budgets: [],
      goals: [],
      debts: [],
      investments: [],
      transactions: [],
      familyMembers: [],
      notifications: [],
      _serverTimestamp: new Date().toISOString(),
    };

    fs.writeFileSync(tempPath, JSON.stringify(cleanPayload, null, 2), 'utf8');
    fs.renameSync(tempPath, storePath);
    console.log(`[STORE] Store financeira limpa e resetada com sucesso no servidor: ${userId}`);

    // Asynchronously purge tables on Supabase using Admin client (bypasses RLS)
    if (supabaseAdmin) {
      try {
        let sbUserId = userId;
        if (req.user.email) {
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
          const found = listData?.users?.find(u => u.email?.toLowerCase() === req.user.email.toLowerCase());
          if (found) sbUserId = found.id;
        }

        const tables = [
          'transactions',
          'credit_cards',
          'budgets',
          'goals',
          'debts',
          'investments',
          'notifications',
          'accounts',
        ];

        for (const tbl of tables) {
          await supabaseAdmin.from(tbl).delete().eq('user_id', sbUserId);
          if (sbUserId !== userId) {
            await supabaseAdmin.from(tbl).delete().eq('user_id', userId);
          }
        }
        console.log(`[STORE] Supabase tables limpas com sucesso via admin para: ${userId} (${sbUserId})`);
      } catch (sbErr) {
        console.warn(`[STORE] Aviso ao limpar Supabase via admin:`, sbErr.message);
      }
    }

    return res.json({
      success: true,
      message: 'Store financeira resetada com sucesso no servidor e na nuvem!',
      serverTimestamp: cleanPayload._serverTimestamp,
      store: cleanPayload,
    });
  } catch (e) {
    console.error('❌ Erro ao resetar store no servidor:', e);
    return res.status(500).json({ success: false, message: 'Erro ao resetar dados no servidor.' });
  }
});

// 5. MAIL RECOVERY WITH MULTI-CODE TOLERANCE, DISK PERSISTENCE & USER VALIDATION
app.post('/api/send-recovery-code', recoveryLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'E-mail é obrigatório.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const user = findUserByEmail(cleanEmail);
  if (!user) {
    console.warn(`[AUTH] Tentativa de recuperação rejeitada (e-mail não cadastrado): ${cleanEmail}`);
    return res.status(404).json({
      success: false,
      message: 'Nenhuma conta cadastrada com este e-mail no Finly. Verifique o endereço ou crie sua conta.',
    });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const now = Date.now();
  const expiresAt = now + 15 * 60 * 1000; // 15 minutes

  const allCodes = loadVerificationCodes();
  const existing = allCodes[cleanEmail] || (user.email ? allCodes[user.email.toLowerCase()] : null);
  const activeCodes = (existing?.codes || [])
    .filter(c => c && c.expiresAt > now)
    .slice(0, 4);

  activeCodes.unshift({ code, expiresAt });

  const record = {
    codes: activeCodes,
    attempts: 0,
    userId: user.id,
    updatedAt: new Date().toISOString(),
  };

  // Associate code with requested email, primary email, and any configured aliases
  allCodes[cleanEmail] = record;
  if (user.email) {
    allCodes[user.email.toLowerCase().trim()] = record;
  }
  if (Array.isArray(user.aliases)) {
    user.aliases.forEach(alias => {
      if (alias) allCodes[alias.toLowerCase().trim()] = record;
    });
  }

  saveVerificationCodes(allCodes);
  console.log(`[AUTH] Código gerado para ${cleanEmail} (Usuário: ${user.id} - ${user.email}): ${code}`);

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
    return res.json({ success: true, message: 'Código de verificação enviado para o seu e-mail!' });
  } catch (error) {
    console.error('Erro ao enviar e-mail via SMTP:', error);
    return res.status(500).json({ success: false, message: 'Erro ao enviar e-mail via servidor SMTP.' });
  }
});

app.post('/api/verify-code', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, message: 'E-mail e código são obrigatórios.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = String(code).replace(/\D/g, '').trim();

  const allCodes = loadVerificationCodes();
  const user = findUserByEmail(cleanEmail);

  let recordKey = cleanEmail;
  let record = allCodes[cleanEmail];
  if (!record && user && user.email && allCodes[user.email.toLowerCase().trim()]) {
    recordKey = user.email.toLowerCase().trim();
    record = allCodes[recordKey];
  }
  if (!record && user && Array.isArray(user.aliases)) {
    for (const alias of user.aliases) {
      const aClean = alias.toLowerCase().trim();
      if (allCodes[aClean]) {
        recordKey = aClean;
        record = allCodes[recordKey];
        break;
      }
    }
  }

  const now = Date.now();
  if (!record || !record.codes || record.codes.length === 0) {
    return res.status(400).json({ success: false, message: 'Nenhum código de verificação pendente para este e-mail.' });
  }

  record.codes = record.codes.filter(c => c && c.expiresAt > now);
  if (record.codes.length === 0) {
    delete allCodes[recordKey];
    saveVerificationCodes(allCodes);
    return res.status(400).json({ success: false, message: 'Código de verificação expirado. Solicite um novo código.' });
  }

  const matches = record.codes.some(c => {
    const target = String(c.code).replace(/\D/g, '').trim();
    return cleanCode === target || (cleanCode.length === 5 && (target.startsWith(cleanCode) || target.endsWith(cleanCode)));
  });

  if (!matches) {
    record.attempts = (record.attempts || 0) + 1;
    if (record.attempts >= 5) {
      delete allCodes[cleanEmail];
      if (user?.email) delete allCodes[user.email.toLowerCase().trim()];
      saveVerificationCodes(allCodes);
      return res.status(429).json({
        success: false,
        message: 'Número excessivo de tentativas incorretas. Código cancelado por segurança. Solicite um novo código.',
      });
    }
    saveVerificationCodes(allCodes);
    return res.status(400).json({
      success: false,
      message: `Código incorreto. Tentativa ${record.attempts} de 5.`,
    });
  }

  return res.json({ success: true, message: 'Código validado com sucesso!' });
});

app.post('/api/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ success: false, message: 'E-mail, código e nova senha são obrigatórios.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = String(code).replace(/\D/g, '').trim();

  const allCodes = loadVerificationCodes();
  const user = findUserByEmail(cleanEmail);

  let recordKey = cleanEmail;
  let record = allCodes[cleanEmail];
  if (!record && user && user.email && allCodes[user.email.toLowerCase().trim()]) {
    recordKey = user.email.toLowerCase().trim();
    record = allCodes[recordKey];
  }
  if (!record && user && Array.isArray(user.aliases)) {
    for (const alias of user.aliases) {
      const aClean = alias.toLowerCase().trim();
      if (allCodes[aClean]) {
        recordKey = aClean;
        record = allCodes[recordKey];
        break;
      }
    }
  }

  const now = Date.now();
  if (!record || !record.codes || record.codes.length === 0) {
    return res.status(400).json({ success: false, message: 'Código de verificação inválido ou expirado.' });
  }

  record.codes = record.codes.filter(c => c && c.expiresAt > now);
  if (record.codes.length === 0) {
    delete allCodes[recordKey];
    saveVerificationCodes(allCodes);
    return res.status(400).json({ success: false, message: 'Código expirado. Solicite um novo código.' });
  }

  const matches = record.codes.some(c => {
    const target = String(c.code).replace(/\D/g, '').trim();
    return cleanCode === target || (cleanCode.length === 5 && (target.startsWith(cleanCode) || target.endsWith(cleanCode)));
  });

  if (!matches) {
    record.attempts = (record.attempts || 0) + 1;
    if (record.attempts >= 5) {
      delete allCodes[cleanEmail];
      if (user?.email) delete allCodes[user.email.toLowerCase().trim()];
      saveVerificationCodes(allCodes);
      return res.status(429).json({
        success: false,
        message: 'Número excessivo de tentativas incorretas. Código cancelado por segurança. Solicite um novo código.',
      });
    }
    saveVerificationCodes(allCodes);
    return res.status(400).json({
      success: false,
      message: `Código incorreto. Tentativa ${record.attempts} de 5.`,
    });
  }

  if (!user) {
    return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
  }

  // 1. Update in Finly users.json
  const users = getUsers();
  const targetUser = users.find(u => u.id === user.id);
  if (targetUser) {
    targetUser.password = hashPassword(newPassword);
    saveUsers(users);
    console.log(`[AUTH] Senha redefinida no users.json com sucesso para ${targetUser.email} (${targetUser.id})`);
  }

  // Purge codes
  delete allCodes[cleanEmail];
  if (user.email) delete allCodes[user.email.toLowerCase().trim()];
  if (Array.isArray(user.aliases)) {
    user.aliases.forEach(a => { if (a) delete allCodes[a.toLowerCase().trim()]; });
  }
  saveVerificationCodes(allCodes);

  // 2. Synchronize with Supabase Auth if Supabase Admin is configured
  if (supabaseAdmin) {
    const syncEmails = [user.email];
    if (Array.isArray(user.aliases)) {
      user.aliases.forEach(a => { if (a && !syncEmails.includes(a)) syncEmails.push(a); });
    }

    for (const em of syncEmails) {
      try {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const sbUser = listData?.users?.find(u => u.email?.toLowerCase() === em.toLowerCase());
        if (sbUser) {
          await supabaseAdmin.auth.admin.updateUserById(sbUser.id, { password: newPassword });
          console.log(`[AUTH] Senha sincronizada no Supabase Auth para ${em}`);
        } else {
          await supabaseAdmin.auth.admin.createUser({
            email: em,
            password: newPassword,
            email_confirm: true,
            user_metadata: { name: user.name, role: user.role, phone: user.phone },
          });
          console.log(`[AUTH] Usuário criado e sincronizado no Supabase Auth para ${em}`);
        }
      } catch (sbErr) {
        console.warn(`⚠️ Aviso ao sincronizar com Supabase para ${em}:`, sbErr.message);
      }
    }
  }

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
