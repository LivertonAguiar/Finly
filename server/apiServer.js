import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
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

  let fallbackVer = '1.1.36';
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

// 1. AUTH: LOGIN (Cryptographic Verification + Token Issuance)
app.post('/api/auth/login', loginLimiter, (req, res) => {
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

// 5. MAIL RECOVERY WITH RATE LIMITING & ATTEMPT THROTTLING
app.post('/api/send-recovery-code', recoveryLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'E-mail é obrigatório.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes.set(cleanEmail, {
    code,
    attempts: 0,
    expiresAt: Date.now() + 15 * 60 * 1000,
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
          <div style="font-size: 40px; font-weight: 900; letter-spacing: 10px; color: #ffffff; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; text-shadow: 0 2px 10px rgba(124,58,237,0.5);">${code}</div>
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
    console.error('Erro ao enviar e-mail:', error);
    return res.status(500).json({ success: false, message: 'Erro ao enviar e-mail via servidor SMTP.' });
  }
});

app.post('/api/verify-code', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, message: 'E-mail e código são obrigatórios.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const record = verificationCodes.get(cleanEmail);
  if (!record || Date.now() > record.expiresAt) {
    verificationCodes.delete(cleanEmail);
    return res.status(400).json({ success: false, message: 'Código inválido ou expirado.' });
  }

  record.attempts = (record.attempts || 0) + 1;

  if (record.code !== code.trim()) {
    if (record.attempts >= 5) {
      verificationCodes.delete(cleanEmail);
      return res.status(429).json({
        success: false,
        message: 'Número excessivo de tentativas incorretas. Código cancelado por segurança. Solicite um novo código.',
      });
    }
    return res.status(400).json({
      success: false,
      message: `Código incorreto. Tentativa ${record.attempts} de 5.`,
    });
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
  if (!record || Date.now() > record.expiresAt) {
    verificationCodes.delete(cleanEmail);
    return res.status(400).json({ success: false, message: 'Código de verificação inválido ou expirado.' });
  }

  record.attempts = (record.attempts || 0) + 1;

  if (record.code !== code.trim()) {
    if (record.attempts >= 5) {
      verificationCodes.delete(cleanEmail);
      return res.status(429).json({
        success: false,
        message: 'Número excessivo de tentativas incorretas. Código cancelado por segurança.',
      });
    }
    return res.status(400).json({
      success: false,
      message: `Código incorreto. Tentativa ${record.attempts} de 5.`,
    });
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
