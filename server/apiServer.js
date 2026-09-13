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

// 4. Token Authentication Middleware (Supabase JWT Canonical + Fallback)
const authenticateToken = async (req, res, next) => {
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

  // 1. Primary & Canonical: Verify Supabase JWT token
  if (supabaseAdmin) {
    try {
      const { data: sbData, error: sbErr } = await supabaseAdmin.auth.getUser(token);
      if (!sbErr && sbData?.user) {
        req.user = {
          userId: sbData.user.id,
          email: sbData.user.email,
          role: sbData.user.user_metadata?.role || 'admin',
        };
        return next();
      }
    } catch (_) {}
  }

  // 2. Legacy / Internal HMAC session verification (demo or system tokens)
  const verification = verifySessionToken(token, APP_SECRET);
  if (verification.valid && verification.payload) {
    req.user = verification.payload;
    return next();
  }

  return res.status(401).json({
    success: false,
    code: 'TOKEN_INVALID_OR_EXPIRED',
    message: 'Sessão inválida ou expirada. Faça login novamente através do Supabase.',
  });
};

// App Version & Update Endpoint (package.json is the authoritative version source)
const VERSION_FILE = path.join(__dirname, 'version.json');
const PKG_FILE = path.join(__dirname, '../package.json');

const getAppVersionInfo = () => {
  let appVersion = '0.0.0';
  try {
    if (fs.existsSync(PKG_FILE)) {
      const pkg = JSON.parse(fs.readFileSync(PKG_FILE, 'utf8'));
      if (pkg.version) appVersion = pkg.version;
    }
  } catch (_) {}

  let metadata = {};
  try {
    if (fs.existsSync(VERSION_FILE)) {
      metadata = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
    }
  } catch (_) {}

  return {
    ...metadata,
    version: appVersion,
    latestVersion: appVersion,
    releaseDate: metadata.releaseDate || '2026-09-08',
    notes: metadata.notes || `Atualização do Finly v${appVersion} disponível.`,
    downloadUrl: `https://github.com/LivertonAguiar/Finly/releases/download/v${appVersion}/finly-v${appVersion}.apk`,
    isLatest: true,
  };
};

app.get('/api/app/version', (req, res) => {
  res.json(getAppVersionInfo());
});

// Market Indicators (BACEN SGS: TR Série 226, IPCA Série 433)
let cachedMarketIndicators = {
  tr: 0.1708,
  trDate: '08/09/2026',
  ipca: 0.38,
  ipcaDate: '01/07/2026',
  updatedAt: new Date().toISOString(),
};

async function fetchBacenMarketRates() {
  try {
    const trRes = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.226/dados/ultimos/1?formato=json', { signal: AbortSignal.timeout(4000) });
    if (trRes.ok) {
      const data = await trRes.json();
      if (Array.isArray(data) && data.length > 0 && data[0].valor) {
        cachedMarketIndicators.tr = parseFloat(data[0].valor.replace(',', '.')) || cachedMarketIndicators.tr;
        cachedMarketIndicators.trDate = data[0].data || cachedMarketIndicators.trDate;
      }
    }
    const ipcaRes = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/1?formato=json', { signal: AbortSignal.timeout(4000) });
    if (ipcaRes.ok) {
      const data = await ipcaRes.json();
      if (Array.isArray(data) && data.length > 0 && data[0].valor) {
        cachedMarketIndicators.ipca = parseFloat(data[0].valor.replace(',', '.')) || cachedMarketIndicators.ipca;
        cachedMarketIndicators.ipcaDate = data[0].data || cachedMarketIndicators.ipcaDate;
      }
    }
    cachedMarketIndicators.updatedAt = new Date().toISOString();
  } catch (err) {
    console.warn('⚠️ Falha ao atualizar indicadores do BACEN em background:', err.message);
  }
}

setInterval(fetchBacenMarketRates, 6 * 60 * 60 * 1000);
setTimeout(fetchBacenMarketRates, 5000);

app.get('/api/market-indicators/latest', (req, res) => {
  res.json(cachedMarketIndicators);
});

const DATA_DIR = path.join(__dirname, 'data');
const STORES_DIR = path.join(DATA_DIR, 'stores');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(STORES_DIR)) fs.mkdirSync(STORES_DIR, { recursive: true });

// Helpers for User Store & Cross-Platform Canonical Mapping
const CANONICAL_USER_MAP = {
  'e2208d7b-f536-4ff8-a0a6-5ed82ebae52b': 'usr-default-liverton',
  'a4d9cc05-b5fa-4656-bee3-60a6dbd2340b': 'usr-default-liverton',
  '75a44ea2-c56f-474f-aaf1-4688f6e778a2': 'usr-demo-financeiro',
  'liverton.aguiar@hotmail.com': 'usr-default-liverton',
  'liverton.aguiar.sup@gmail.com': 'usr-default-liverton',
  'demo@finly.com': 'usr-demo-financeiro',
};

// Map to canonical Postgres UUID for Supabase persistence
const POSTGRES_USER_UUID_MAP = {
  'usr-default-liverton': 'e2208d7b-f536-4ff8-a0a6-5ed82ebae52b',
  'e2208d7b-f536-4ff8-a0a6-5ed82ebae52b': 'e2208d7b-f536-4ff8-a0a6-5ed82ebae52b',
  'usr-demo-financeiro': '75a44ea2-c56f-474f-aaf1-4688f6e778a2',
  '75a44ea2-c56f-474f-aaf1-4688f6e778a2': '75a44ea2-c56f-474f-aaf1-4688f6e778a2',
};

// Active SSE clients for instant push synchronization (Web <-> Mobile)
const sseClients = new Map(); // canonicalUserId -> Set<Response>

function broadcastStoreUpdate(userId, eventData) {
  const canonicalId = CANONICAL_USER_MAP[userId] || userId;
  const targetIds = new Set([canonicalId, userId]);
  for (const [alias, mapped] of Object.entries(CANONICAL_USER_MAP)) {
    if (mapped === canonicalId || alias === canonicalId) {
      targetIds.add(alias);
      targetIds.add(mapped);
    }
  }

  const payloadString = `data: ${JSON.stringify(eventData)}\n\n`;
  targetIds.forEach(id => {
    const clients = sseClients.get(id);
    if (clients) {
      clients.forEach(clientRes => {
        try {
          clientRes.write(payloadString);
        } catch (_) {
          clients.delete(clientRes);
        }
      });
    }
  });
}

const getUserStorePath = (userId) => {
  if (!userId) return path.join(STORES_DIR, 'anonymous.json');
  let canonicalId = CANONICAL_USER_MAP[userId] || userId;
  if (typeof canonicalId === 'string' && canonicalId.includes('@')) {
    const user = findUserByEmail(canonicalId);
    if (user) canonicalId = user.id;
  }
  const safeId = canonicalId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(STORES_DIR, `${safeId}.json`);
};

const saveUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
};

const getUsers = () => {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    const users = JSON.parse(raw);
    let stripped = false;

    // Architectural Guarantee: Strip all passwords from users.json. Supabase Auth is canonical.
    const sanitized = users.map(u => {
      if ('password' in u) {
        delete u.password;
        stripped = true;
      }
      return u;
    });

    if (stripped) {
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

// Initial Users Database Setup (No passwords stored - Supabase Auth is canonical)
if (!fs.existsSync(USERS_FILE)) {
  const initialUsers = [
    {
      id: 'usr-demo-financeiro',
      name: 'Conta Demonstração',
      email: 'demo@finly.com',
      phone: '11999998888',
      role: 'admin',
      createdAt: '2026-01-01',
    }
  ];
  saveUsers(initialUsers);
} else {
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

// 1. AUTH: LOGIN (Deprecated - Supabase Auth is the single source of truth)
app.post('/api/auth/login', loginLimiter, (req, res) => {
  return res.status(400).json({
    success: false,
    code: 'USE_SUPABASE_AUTH',
    message: 'A autenticação é gerenciada exclusivamente pelo Supabase Auth. Realize o login através do cliente Supabase.',
  });
});

// 2. AUTH: REGISTER (Deprecated - Supabase Auth is the single source of truth)
app.post('/api/auth/register', loginLimiter, (req, res) => {
  return res.status(400).json({
    success: false,
    code: 'USE_SUPABASE_AUTH',
    message: 'O cadastro de contas é gerenciado exclusivamente pelo Supabase Auth.',
  });
});

// 2.1 AUTH: CHANGE PASSWORD (Deprecated - Supabase Auth is the single source of truth)
app.post('/api/auth/change-password', authenticateToken, (req, res) => {
  return res.status(400).json({
    success: false,
    code: 'USE_SUPABASE_AUTH',
    message: 'A alteração de senha é realizada diretamente via Supabase Auth.',
  });
});

// Ghost Data Shields (Prevents resurrected stale August transactions and cards)
const GHOST_CARDS_SET = new Set([
  'card-1788094641945-bzt',
  'card-1788094677952-2ym',
  'card-1788916198444-dq3',
]);

const isGhostTransactionRecord = (t) => {
  if (!t || !t.id) return true;
  const id = String(t.id);
  if (id.startsWith('tx-1788095') || id.startsWith('tx-1788210') || id.includes('1788193846930')) return true;
  if (t.date && (t.date.startsWith('2026-08-30') || t.date.startsWith('2026-08-31'))) return true;
  if (t.createdAt && (String(t.createdAt).startsWith('2026-08-30') || String(t.createdAt).startsWith('2026-08-31'))) return true;
  return false;
};

const sanitizeStoreData = (store) => {
  if (!store || typeof store !== 'object') return store;
  const sanitized = { ...store };
  if (Array.isArray(sanitized.cards)) {
    sanitized.cards = sanitized.cards.filter(c => c && !GHOST_CARDS_SET.has(c.id));
  }
  if (Array.isArray(sanitized.transactions)) {
    sanitized.transactions = sanitized.transactions.filter(t => !isGhostTransactionRecord(t));
  }
  return sanitized;
};

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
    const store = sanitizeStoreData(JSON.parse(raw));
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

// 3.1 REAL-TIME PUSH: SERVER-SENT EVENTS (SSE) STREAM
app.get('/api/sync/events', (req, res) => {
  let token = req.query.token;
  if (!token && req.headers.authorization) {
    token = req.headers.authorization.replace(/^Bearer\s+/i, '');
  }

  let sessionUser = null;
  if (token) {
    try {
      sessionUser = verifySessionToken(token, APP_SECRET);
    } catch (_) {}
  }

  const userId = sessionUser?.userId || req.query.userId || req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Não autorizado para eventos em tempo real.' });
  }

  const canonicalId = CANONICAL_USER_MAP[userId] || userId;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', userId: canonicalId })}\n\n`);

  if (!sseClients.has(canonicalId)) {
    sseClients.set(canonicalId, new Set());
  }
  sseClients.get(canonicalId).add(res);

  // Keep-alive heartbeat every 15s to prevent reverse-proxy timeout
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch (_) {
      clearInterval(heartbeat);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    const clients = sseClients.get(canonicalId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) sseClients.delete(canonicalId);
    }
  });
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
    const sanitizedStore = sanitizeStoreData(store);
    const payload = {
      ...sanitizedStore,
      _serverTimestamp: new Date().toISOString(),
    };

    // Atomic write to primary store path
    fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2), 'utf8');
    fs.renameSync(tempPath, storePath);

    // Cross-identity mirror: ensure both UUID and alias stores exist and are identical
    const canonicalId = CANONICAL_USER_MAP[userId] || userId;
    if (canonicalId === 'usr-default-liverton' || userId === 'e2208d7b-f536-4ff8-a0a6-5ed82ebae52b') {
      const mirrorUuidPath = path.join(STORES_DIR, 'e2208d7b-f536-4ff8-a0a6-5ed82ebae52b.json');
      const mirrorAliasPath = path.join(STORES_DIR, 'usr-default-liverton.json');
      try {
        if (storePath !== mirrorUuidPath) fs.writeFileSync(mirrorUuidPath, JSON.stringify(payload, null, 2), 'utf8');
        if (storePath !== mirrorAliasPath) fs.writeFileSync(mirrorAliasPath, JSON.stringify(payload, null, 2), 'utf8');
      } catch (_) {}
    }

    // Direct background sync with Supabase PostgreSQL using Admin SDK (bypasses RLS)
    if (supabaseAdmin && Array.isArray(sanitizedStore.cards)) {
      const postgresUserId = POSTGRES_USER_UUID_MAP[userId] || 'e2208d7b-f536-4ff8-a0a6-5ed82ebae52b';
      const cardRows = sanitizedStore.cards
        .filter(c => c && !GHOST_CARDS_SET.has(c.id))
        .map(c => ({
          id: c.id,
          user_id: postgresUserId,
          name: c.name || 'Cartão de Crédito',
          brand: c.brand || 'Mastercard',
          limit: Number(c.limit) || 0,
          closing_day: Number(c.closingDay) || 1,
          due_day: Number(c.dueDay) || 10,
          color: c.color || '#820ad1',
          default_account_id: c.defaultAccountId || null,
        }));

      if (cardRows.length > 0) {
        supabaseAdmin
          .from('credit_cards')
          .upsert(cardRows)
          .then(({ error }) => {
            if (error) console.warn('⚠️ Erro ao persistir cartões no Supabase via Admin:', error.message);
            else console.log(`💳 [SUPABASE ADMIN] ${cardRows.length} cartões sincronizados com sucesso.`);
          })
          .catch(err => console.warn('⚠️ Falha Supabase card upsert:', err.message));
      }
    }

    // Instant real-time push broadcast to all other open clients (Web <-> Mobile)
    broadcastStoreUpdate(userId, {
      type: 'STORE_UPDATED',
      timestamp: payload._serverTimestamp,
      store: sanitizedStore,
    });

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
      transactionSeries: [],
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

  let user = findUserByEmail(cleanEmail);
  if (!user && supabaseAdmin) {
    try {
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
      const sbUser = listData?.users?.find(u => u.email?.toLowerCase() === cleanEmail);
      if (sbUser) {
        user = {
          id: sbUser.id,
          name: sbUser.user_metadata?.name || sbUser.email.split('@')[0],
          email: sbUser.email,
          role: sbUser.user_metadata?.role || 'admin',
        };
      }
    } catch (_) {}
  }

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

  if (!user && supabaseAdmin) {
    try {
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
      const sbUser = listData?.users?.find(u => u.email?.toLowerCase() === cleanEmail);
      if (sbUser) {
        user = {
          id: sbUser.id,
          name: sbUser.user_metadata?.name || sbUser.email.split('@')[0],
          email: sbUser.email,
          role: sbUser.user_metadata?.role || 'admin',
        };
      }
    } catch (_) {}
  }

  if (!user) {
    return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
  }

  // Purge codes
  delete allCodes[cleanEmail];
  if (user.email) delete allCodes[user.email.toLowerCase().trim()];
  if (Array.isArray(user.aliases)) {
    user.aliases.forEach(a => { if (a) delete allCodes[a.toLowerCase().trim()]; });
  }
  saveVerificationCodes(allCodes);

  // Update password EXCLUSIVELY in Supabase Auth (Single Source of Truth - No passwords in users.json)
  if (supabaseAdmin) {
    const syncEmails = [user.email];
    if (Array.isArray(user.aliases)) {
      user.aliases.forEach(a => { if (a && !syncEmails.includes(a)) syncEmails.push(a); });
    }

    let updatedCount = 0;
    for (const em of syncEmails) {
      try {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const sbUser = listData?.users?.find(u => u.email?.toLowerCase() === em.toLowerCase());
        if (sbUser) {
          await supabaseAdmin.auth.admin.updateUserById(sbUser.id, { password: newPassword });
          console.log(`[AUTH] Senha redefinida exclusivamente no Supabase Auth para ${em} (${sbUser.id})`);
          updatedCount++;
        }
      } catch (sbErr) {
        console.warn(`⚠️ Aviso ao atualizar senha no Supabase Auth para ${em}:`, sbErr.message);
      }
    }

    if (updatedCount === 0) {
      return res.status(500).json({ success: false, message: 'Não foi possível atualizar a senha no Supabase Auth.' });
    }
  }

  return res.json({ success: true, message: 'Sua senha foi redefinida com sucesso no Supabase Auth!' });
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
