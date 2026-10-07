import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import { verifySessionToken } from './security/token.js';

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
// Nginx Proxy Manager is the only network hop allowed to reach the app container.
// Trust exactly that hop so rate limits use the real client IP without accepting
// arbitrary forwarded chains from direct public traffic.
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;
const APP_SECRET = process.env.APP_SECRET;
const LEGACY_SESSION_TOKENS_ENABLED = process.env.ALLOW_LEGACY_SESSION_TOKENS === 'true'
  && typeof APP_SECRET === 'string'
  && APP_SECRET.length >= 32;
const DISABLE_BACKGROUND_JOBS = process.env.FINLY_DISABLE_BACKGROUND_JOBS === 'true';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

const isValidUserUuid = (value) => typeof value === 'string' && UUID_PATTERN.test(value);

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
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-auth-token', 'x-session-id'],
}));

// Financial stores are compact JSON. Reject oversized payloads before route logic
// to cap memory use and prevent unbounded base64 attachments/imports.
app.use(express.json({ limit: '8mb' }));
app.use((error, req, res, next) => {
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'O arquivo ou conjunto de dados excede o limite permitido de 8 MiB.',
    });
  }
  return next(error);
});

// Audit logger: registra somente metadados da requisição, nunca dados financeiros ou credenciais.
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    const timestamp = new Date().toISOString();
    const bodyFields = req.body && typeof req.body === 'object' && !Array.isArray(req.body)
      ? Object.keys(req.body).sort()
      : [];
    const fieldsSummary = bodyFields.length > 0 ? ` - Fields: ${bodyFields.join(',')}` : '';
    console.log(`[${timestamp}] [HTTP ${req.method}] ${req.path} - IP: ${req.ip}${fieldsSummary}`);
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

const recoveryVerificationLimiter = createRateLimiter({
  prefix: 'recovery-verify',
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Limite de tentativas de verificação atingido. Solicite um novo código em 15 minutos.',
});

const passwordResetLimiter = createRateLimiter({
  prefix: 'recovery-reset',
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Limite de tentativas de redefinição atingido. Tente novamente em 15 minutos.',
});

const authenticateAccessToken = async (token) => {
  if (supabaseAdmin) {
    try {
      const { data: sbData, error: sbErr } = await supabaseAdmin.auth.getUser(token);
      if (!sbErr && sbData?.user) {
        if (!isValidUserUuid(sbData.user.id)) {
          return { valid: false, code: 'INVALID_AUTH_SUBJECT' };
        }
        return {
          valid: true,
          provider: 'supabase',
          user: {
            userId: sbData.user.id,
            email: sbData.user.email,
            role: sbData.user.app_metadata?.role || sbData.user.user_metadata?.role || 'user',
          },
        };
      }
    } catch (_) {}
  }

  if (LEGACY_SESSION_TOKENS_ENABLED) {
    const verification = verifySessionToken(token, APP_SECRET);
    if (verification.valid && verification.payload && isValidUserUuid(verification.payload.userId)) {
      return {
        valid: true,
        provider: 'legacy',
        user: verification.payload,
      };
    }
  }

  return { valid: false, code: 'TOKEN_INVALID_OR_EXPIRED' };
};

// 4. Token Authentication Middleware (Supabase JWT canonical; legacy is explicit opt-in)
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

  const authentication = await authenticateAccessToken(token);
  if (authentication.valid) {
    req.user = authentication.user;
    req.authProvider = authentication.provider;
    return next();
  }

  return res.status(401).json({
    success: false,
    code: authentication.code,
    message: 'Sessão inválida ou expirada. Faça login novamente através do Supabase.',
  });
};

// App Version & Update Endpoint (package.json is the authoritative version source)
const VERSION_FILE = path.join(__dirname, 'version.json');
const MANIFEST_FILE = path.join(__dirname, 'manifest.json');
const PKG_FILE = path.join(__dirname, '../package.json');
const BUNDLES_DIR = path.join(__dirname, 'public/bundles');

try {
  if (!fs.existsSync(BUNDLES_DIR)) {
    fs.mkdirSync(BUNDLES_DIR, { recursive: true });
  }
} catch (_) {}

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

const getAppManifestInfo = () => {
  const versionInfo = getAppVersionInfo();
  let manifest = {
    native: {
      version: versionInfo.version,
      minimumVersion: '1.1.0',
      downloadUrl: versionInfo.downloadUrl,
    },
    web: {
      version: versionInfo.version,
      minNativeVersion: '1.1.0',
      bundleUrl: `https://finly.lpaguiar.com.br/bundles/finly-bundle-v${versionInfo.version}.zip`,
      sha256: '',
      mandatory: false,
      releaseDate: versionInfo.releaseDate,
      notes: versionInfo.notes,
    },
  };

  try {
    if (fs.existsSync(MANIFEST_FILE)) {
      const fileData = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
      manifest = {
        ...manifest,
        ...fileData,
        native: { ...manifest.native, ...(fileData.native || {}) },
        web: { ...manifest.web, ...(fileData.web || {}) },
      };
    }
  } catch (err) {
    console.warn('⚠️ Falha ao ler manifest.json:', err.message);
  }

  if (!manifest.native.version) {
    manifest.native.version = versionInfo.version;
  }
  if (!manifest.native.downloadUrl) {
    manifest.native.downloadUrl = versionInfo.downloadUrl;
  }

  return manifest;
};

app.get('/api/app/version', (req, res) => {
  res.json(getAppVersionInfo());
});

app.get('/api/app/manifest', (req, res) => {
  res.json(getAppManifestInfo());
});

// Serve OTA web bundles directly
app.use('/bundles', express.static(BUNDLES_DIR, {
  maxAge: '1y',
  immutable: true,
}));

// Serve branded HTML email templates
app.use('/email-templates', express.static(path.join(__dirname, 'email-templates'), {
  maxAge: '1h',
  setHeaders: (res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
  },
}));



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

if (!DISABLE_BACKGROUND_JOBS) {
  setInterval(fetchBacenMarketRates, 6 * 60 * 60 * 1000);
  setTimeout(fetchBacenMarketRates, 5000);
}

app.get('/api/market-indicators/latest', (req, res) => {
  res.json(cachedMarketIndicators);
});

const DATA_DIR = process.env.FINLY_DATA_DIR
  ? path.resolve(process.env.FINLY_DATA_DIR)
  : path.join(__dirname, 'data');
const STORES_DIR = path.join(DATA_DIR, 'stores');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(STORES_DIR)) fs.mkdirSync(STORES_DIR, { recursive: true });

// Legacy store aliases are migration-only and must be provided explicitly by the operator.
// Authentication and PostgreSQL ownership always use the validated Supabase UUID.
const LEGACY_STORE_ALIAS_MAP = (() => {
  if (!process.env.FINLY_LEGACY_STORE_ALIAS_MAP) return {};
  try {
    const parsed = JSON.parse(process.env.FINLY_LEGACY_STORE_ALIAS_MAP);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([userId, alias]) => (
        isValidUserUuid(userId)
        && typeof alias === 'string'
        && /^[a-zA-Z0-9_-]+$/u.test(alias)
      )),
    );
  } catch (_) {
    console.warn('⚠️ FINLY_LEGACY_STORE_ALIAS_MAP inválido; aliases legados foram ignorados.');
    return {};
  }
})();

const getStoreIdentity = (userId) => LEGACY_STORE_ALIAS_MAP[userId] || userId;

// Active SSE clients for instant push synchronization (Web <-> Mobile)
const sseClients = new Map(); // canonicalUserId -> Set<Response>

function broadcastStoreUpdate(userId, eventData, originSessionId) {
  const canonicalId = getStoreIdentity(userId);
  const targetIds = new Set([canonicalId]);

  const payloadString = `data: ${JSON.stringify(eventData)}\n\n`;
  targetIds.forEach(id => {
    const clients = sseClients.get(id);
    if (clients) {
      clients.forEach(clientRes => {
        if (originSessionId && clientRes.sessionId && clientRes.sessionId === originSessionId) {
          return; // Skip echo back to originating client session
        }
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
  const canonicalId = getStoreIdentity(userId);
  const safeId = canonicalId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(STORES_DIR, `${safeId}.json`);
};

// Recovery codes remain compatible with the existing six-digit HTTP flow, but are
// generated cryptographically and persisted only as salted scrypt hashes.
const VERIFICATION_CODES_FILE = path.join(DATA_DIR, 'verificationCodes.json');
const RECOVERY_CODE_PATTERN = /^\d{6}$/u;
const RECOVERY_CODE_TTL_MS = 15 * 60 * 1000;
const GENERIC_RECOVERY_MESSAGE = 'Se existir uma conta para este e-mail, enviaremos as instruções de recuperação.';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email);

const createRecoveryCode = () => crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');

const hashRecoveryCode = (code) => {
  const salt = crypto.randomBytes(16);
  const derivedKey = crypto.scryptSync(code, salt, 32);
  return `scrypt$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
};

const verifyRecoveryCode = (code, storedHash) => {
  if (!RECOVERY_CODE_PATTERN.test(code) || typeof storedHash !== 'string') return false;
  const [algorithm, saltHex, expectedHex] = storedHash.split('$');
  if (algorithm !== 'scrypt' || !saltHex || !expectedHex) return false;
  try {
    const actual = crypto.scryptSync(code, Buffer.from(saltHex, 'hex'), 32);
    const expected = Buffer.from(expectedHex, 'hex');
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch (_) {
    return false;
  }
};

const loadVerificationCodes = () => {
  try {
    if (fs.existsSync(VERIFICATION_CODES_FILE)) {
      const raw = fs.readFileSync(VERIFICATION_CODES_FILE, 'utf8');
      const data = JSON.parse(raw);
      const now = Date.now();
      const cleaned = {};
      for (const [emailKey, record] of Object.entries(data)) {
        if (
          record
          && typeof record.codeHash === 'string'
          && record.expiresAt > now
          && isValidUserUuid(record.userId)
        ) {
          cleaned[emailKey] = record;
        }
      }
      return cleaned;
    }
  } catch (e) {
    console.error('⚠️ Erro ao ler o armazenamento de recuperação:', e.code || e.name);
  }
  return {};
};

const saveVerificationCodes = (codesObj) => {
  const tempPath = `${VERIFICATION_CODES_FILE}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(codesObj, null, 2), 'utf8');
  fs.renameSync(tempPath, VERIFICATION_CODES_FILE);
};

const findSupabaseUserByEmail = async (email) => {
  if (!supabaseAdmin) return null;
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) return null;
    return data?.users?.find((user) => normalizeEmail(user.email) === email) || null;
  } catch (_) {
    return null;
  }
};

// SMTP Transporter using Environment Variables
const smtpPort = Number.parseInt(process.env.SMTP_PORT || '465', 10);
const smtpOptions = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: smtpPort,
  secure: process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === 'true'
    : smtpPort === 465,
};
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  smtpOptions.auth = {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  };
}
const transporter = nodemailer.createTransport(smtpOptions);

if (!DISABLE_BACKGROUND_JOBS) {
  transporter.verify((error) => {
    if (error) {
      console.error('❌ Erro na conexão SMTP:', error.code || error.name);
    } else {
      console.log('✅ Servidor SMTP pronto para envio de e-mails!');
    }
  });
}

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

// Ghost Data Shields (Prevents resurrected stale August transactions, cards, and duplicate debts)
const GHOST_CARDS_SET = new Set([
  'card-1788094641945-bzt',
  'card-1788094677952-2ym',
  'card-1788916198444-dq3',
]);

const GHOST_DEBTS_SET = new Set([
  'debt-1789003413274-l3jh',
]);

const isGhostTransactionRecord = (t) => {
  if (!t || !t.id) return true;
  const id = String(t.id);
  if (id.startsWith('tx-1788095') || id.startsWith('tx-1788210') || id.includes('1788193846930')) return true;
  if (id.includes('debt-1789003413274-l3jh')) return true;
  const debtId = String(t.debtId || t.debt_id || t.installments?.debtId || '');
  if (GHOST_DEBTS_SET.has(debtId)) return true;
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
  if (Array.isArray(sanitized.debts)) {
    sanitized.debts = sanitized.debts.filter(d => d && !GHOST_DEBTS_SET.has(d.id));
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

// 3.1 REAL-TIME PUSH: SERVER-SENT EVENTS (SSE) STREAM (Authenticated + CORS-safe)
app.get('/api/sync/events', async (req, res) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return res.status(401).json({ success: false, message: 'Acesso negado: Token de autenticação ausente para eventos em tempo real.' });
  }

  const authentication = await authenticateAccessToken(token);
  if (!authentication.valid) {
    return res.status(401).json({ success: false, message: 'Token inválido ou expirado. Reconecte-se para eventos em tempo real.' });
  }

  const userId = authentication.user.userId;
  const canonicalId = getStoreIdentity(userId);

  // Derive CORS origin from whitelist (never wildcard)
  const requestOrigin = req.headers.origin;
  const corsOrigin = (requestOrigin && allowedOrigins.includes(requestOrigin))
    ? requestOrigin
    : allowedOrigins[0];

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Credentials': 'true',
  });

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', userId: canonicalId })}\n\n`);

  const sessionId = req.query.sessionId || req.headers['x-session-id'];
  res.sessionId = sessionId;

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

    // Guard shield: prevent an empty/new client session from accidentally wiping out
    // rich collections (transactions, cards, series) already persisted on the server
    if (fs.existsSync(storePath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(storePath, 'utf8'));
        if ((!sanitizedStore.transactions || sanitizedStore.transactions.length === 0) && (existing.transactions?.length > 0)) {
          console.warn(`🛡️ [STORE SHIELD] Preservando ${existing.transactions.length} transações existentes no servidor.`);
          sanitizedStore.transactions = existing.transactions;
          if (!sanitizedStore.transactionSeries || sanitizedStore.transactionSeries.length === 0) {
            sanitizedStore.transactionSeries = existing.transactionSeries || [];
          }
        }
        if ((!sanitizedStore.cards || sanitizedStore.cards.length === 0) && (existing.cards?.length > 0)) {
          console.warn(`🛡️ [STORE SHIELD] Preservando ${existing.cards.length} cartões existentes no servidor.`);
          sanitizedStore.cards = existing.cards;
        }
        if ((!sanitizedStore.accounts || sanitizedStore.accounts.length === 0) && (existing.accounts?.length > 0)) {
          sanitizedStore.accounts = existing.accounts;
        }
        if ((!sanitizedStore.debts || sanitizedStore.debts.length === 0) && (existing.debts?.length > 0)) {
          sanitizedStore.debts = existing.debts;
        }
      } catch (_) {}
    }

    const payload = {
      ...sanitizedStore,
      _serverTimestamp: new Date().toISOString(),
    };

    // Atomic write to primary store path
    fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2), 'utf8');
    fs.renameSync(tempPath, storePath);

    // Direct background sync with Supabase PostgreSQL using Admin SDK (bypasses RLS)
    if (supabaseAdmin) {
      const postgresUserId = userId;
      
      // 1. Sync cards
      if (Array.isArray(sanitizedStore.cards)) {
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
              else console.log(`💳 [SUPABASE ADMIN] ${cardRows.length} cartões sincronizados.`);
            })
            .catch(err => console.warn('⚠️ Falha Supabase card upsert:', err.message));
        }
      }

      // 2. Sync accounts
      if (Array.isArray(sanitizedStore.accounts) && sanitizedStore.accounts.length > 0) {
        const accRows = sanitizedStore.accounts.map(a => ({
          id: a.id,
          user_id: postgresUserId,
          name: a.name || 'Conta',
          type: a.type || 'checking',
          balance: Number(a.balance) || 0,
          initial_balance: Number(a.initialBalance) || 0,
          institution: a.institution || '',
          color: a.color || '#10b981',
          include_in_total: a.includeInTotal !== false,
          account_number: a.accountNumber || null,
        }));
        supabaseAdmin.from('accounts').upsert(accRows)
          .then(({ error }) => {
            if (error) console.warn('⚠️ Erro ao persistir contas no Supabase via Admin:', error.message);
            else console.log(`🏦 [SUPABASE ADMIN] ${accRows.length} contas sincronizadas.`);
          })
          .catch(err => console.warn('⚠️ Falha Supabase account upsert:', err.message));
      }
    }

    // Instant real-time push broadcast to all other open clients (Web <-> Mobile)
    const originSessionId = req.headers['x-session-id'] || req.body?.sessionId;
    broadcastStoreUpdate(userId, {
      type: 'STORE_UPDATED',
      timestamp: payload._serverTimestamp,
      store: sanitizedStore,
    }, originSessionId);

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
          await supabaseAdmin.from(tbl).delete().eq('user_id', userId);
        }
        console.log(`[STORE] Supabase tables limpas com sucesso via admin para: ${userId}`);
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

// 4.2 PERMANENT ACCOUNT & DATA DELETION (Purge all tables, auth.users and disk store)
app.post('/api/user/delete-account', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const userEmail = req.user.email;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'Identificador de usuário ausente no token.' });
  }

  // Proteção: conta demo não pode ser excluída
  if (userId === 'usr-demo-financeiro' || (userEmail && userEmail.toLowerCase() === 'demo@finly.com')) {
    return res.status(403).json({
      success: false,
      code: 'DEMO_ACCOUNT_PROTECTED',
      message: 'A conta de demonstração do sistema não pode ser excluída.',
    });
  }

  console.log(`⚠️ [DELETE-ACCOUNT] Iniciando exclusão definitiva da conta: ${userId} (${userEmail || 'sem email'})`);

  try {
    // 1. Excluir dados no Supabase PostgreSQL via Admin SDK (bypasses RLS)
    if (supabaseAdmin) {
      try {
        // Tentar primeiro via RPC se disponível
        const { error: rpcErr } = await supabaseAdmin.rpc('delete_user_completely', { target_user_id: userId });
        if (rpcErr) {
          console.warn(`[DELETE-ACCOUNT] Aviso ao chamar RPC delete_user_completely: ${rpcErr.message}. Executando exclusão direta por tabelas.`);
        }
      } catch (rpcEx) {
        console.warn(`[DELETE-ACCOUNT] RPC indisponível, prosseguindo com exclusão direta:`, rpcEx.message);
      }

      // Exclusão direta em todas as tabelas em ordem reversa
      const tables = [
        'transaction_components',
        'transactions',
        'transaction_series',
        'credit_cards',
        'budgets',
        'goals',
        'debts',
        'investments',
        'categories',
        'family_members',
        'notifications',
        'accounts',
        'profiles',
      ];

      for (const tbl of tables) {
        try {
          const col = (tbl === 'profiles') ? 'id' : 'user_id';
          await supabaseAdmin.from(tbl).delete().eq(col, userId);
        } catch (tblErr) {
          console.warn(`[DELETE-ACCOUNT] Aviso ao limpar tabela ${tbl}:`, tblErr.message);
        }
      }

      // 2. Excluir o usuário de auth.users no Supabase Auth
      try {
        const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (authErr) {
          console.error(`❌ [DELETE-ACCOUNT] Erro ao deletar do Supabase Auth:`, authErr.message);
        } else {
          console.log(`✅ [DELETE-ACCOUNT] Usuário ${userId} removido com sucesso de auth.users.`);
        }
      } catch (authEx) {
        console.error(`❌ [DELETE-ACCOUNT] Falha ao invocar deleteUser no Supabase Auth:`, authEx.message);
      }
    }

    // 3. Excluir arquivo local da store em disco no servidor
    const storePath = getUserStorePath(userId);
    const tempPath = `${storePath}.tmp`;
    try {
      if (fs.existsSync(storePath)) {
        fs.unlinkSync(storePath);
        console.log(`[DELETE-ACCOUNT] Arquivo de store removido: ${storePath}`);
      }
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch (fErr) {
      console.warn(`[DELETE-ACCOUNT] Falha ao excluir arquivo em disco:`, fErr.message);
    }

    // 4. Limpar códigos de verificação pendentes
    if (userEmail) {
      try {
        const cleanEmail = normalizeEmail(userEmail);
        const allCodes = loadVerificationCodes();
        if (allCodes[cleanEmail]) {
          delete allCodes[cleanEmail];
          saveVerificationCodes(allCodes);
        }
      } catch (_) {}
    }

    // 5. Encerrar conexões SSE ativas desse usuário
    const canonicalId = getStoreIdentity(userId);
    const clients = sseClients.get(canonicalId);
    if (clients) {
      clients.forEach(clientRes => {
        try {
          clientRes.write(`data: ${JSON.stringify({ type: 'ACCOUNT_DELETED' })}\n\n`);
          clientRes.end();
        } catch (_) {}
      });
      sseClients.delete(canonicalId);
    }

    return res.json({
      success: true,
      message: 'Conta de usuário e todos os dados vinculados foram permanentemente excluídos do banco de dados e do servidor.',
    });
  } catch (err) {
    console.error('❌ [DELETE-ACCOUNT] Erro inesperado ao excluir conta:', err);
    return res.status(500).json({
      success: false,
      message: 'Ocorreu um erro no servidor ao tentar excluir os dados da conta.',
    });
  }
});

// 5. PASSWORD RECOVERY (generic response, hashed code, endpoint-specific limits)
app.post('/api/send-recovery-code', recoveryLimiter, async (req, res) => {
  const cleanEmail = normalizeEmail(req.body?.email);
  if (!isValidEmail(cleanEmail)) {
    return res.status(400).json({ success: false, message: 'Informe um e-mail válido.' });
  }

  const user = await findSupabaseUserByEmail(cleanEmail);
  if (user && isValidUserUuid(user.id)) {
    const code = createRecoveryCode();
    const allCodes = loadVerificationCodes();
    allCodes[cleanEmail] = {
      codeHash: hashRecoveryCode(code),
      expiresAt: Date.now() + RECOVERY_CODE_TTL_MS,
      attempts: 0,
      userId: user.id,
      updatedAt: new Date().toISOString(),
    };

    try {
      saveVerificationCodes(allCodes);
      const senderEmail = process.env.SMTP_USER || 'suporte@finly.com';
      await transporter.sendMail({
        from: `"Finly" <${senderEmail}>`,
        to: cleanEmail,
        subject: 'Código de verificação - Finly',
        html: `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head><meta charset="UTF-8"><title>Código de Verificação</title></head>
          <body style="margin:0;padding:0;background-color:#0b0c10;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
            <center style="width:100%;background-color:#0b0c10;padding:32px 12px 48px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background-color:#14151d;border-radius:24px;border:1px solid #232533;box-shadow:0 16px 40px rgba(0,0,0,0.45);overflow:hidden;">
                <tr>
                  <td style="padding:36px 32px 20px;text-align:center;">
                    <div style="display:inline-block;width:48px;height:48px;line-height:48px;background:linear-gradient(135deg,#6366f1,#8b5cf6,#d946ef);border-radius:16px;color:#ffffff;font-weight:900;font-size:26px;box-shadow:0 8px 20px rgba(139,92,246,0.3);">F</div>
                    <div style="margin-top:12px;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Fin<span style="color:#a78bfa;">ly</span></div>
                    <div style="font-size:12px;font-weight:500;color:#94a3b8;letter-spacing:0.5px;text-transform:uppercase;margin-top:2px;">Segurança &amp; Acesso</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 32px 28px;text-align:center;">
                    <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#f8fafc;">Código de Verificação 🔐</h1>
                    <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#94a3b8;">Utilize o código de segurança de 6 dígitos abaixo para confirmar sua identidade no Finly:</p>
                    <div style="background-color:#1a1b26;border:1px solid #2e3042;border-radius:18px;padding:22px 16px;margin:0 auto;max-width:420px;">
                      <div style="font-size:11px;font-weight:800;color:#c084fc;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">SEU CÓDIGO DE SEGURANÇA</div>
                      <div style="font-family:'SF Mono',Consolas,Monaco,monospace;font-size:36px;font-weight:900;letter-spacing:8px;color:#ffffff;margin:6px 0;">${code}</div>
                      <div style="font-size:12px;color:#94a3b8;margin-top:4px;">Válido por 15 minutos</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 32px 32px;text-align:center;">
                    <div style="background-color:rgba(30,41,59,0.4);border-radius:12px;padding:14px 16px;border:1px solid #1e293b;">
                      <p style="margin:0;font-size:12px;line-height:1.5;color:#64748b;">🔒 Se você não solicitou este código, ignore esta mensagem com segurança. Sua conta permanece protegida.</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background-color:#0e0f15;padding:20px 32px;text-align:center;border-top:1px solid #1e202b;">
                    <p style="margin:0 0 6px;font-size:12px;color:#64748b;">Finly &copy; 2026 &bull; Plataforma de Gestão Financeira Pessoal &amp; Familiar</p>
                    <a href="https://finly.lpaguiar.com.br" target="_blank" style="font-size:12px;color:#818cf8;text-decoration:none;">finly.lpaguiar.com.br</a>
                  </td>
                </tr>
              </table>
            </center>
          </body>
          </html>
        `,
      });
    } catch (error) {
      delete allCodes[cleanEmail];
      try {
        saveVerificationCodes(allCodes);
      } catch (_) {}
      console.error('[AUTH] Falha interna no envio de recuperação:', error.code || error.name);
    }
  }

  return res.json({ success: true, message: GENERIC_RECOVERY_MESSAGE });
});

const registerInvalidRecoveryAttempt = (allCodes, email, record) => {
  record.attempts = (record.attempts || 0) + 1;
  if (record.attempts >= 5) {
    delete allCodes[email];
  }
  saveVerificationCodes(allCodes);
  return record.attempts;
};

app.post('/api/verify-code', recoveryVerificationLimiter, (req, res) => {
  const cleanEmail = normalizeEmail(req.body?.email);
  const cleanCode = String(req.body?.code || '').trim();

  if (!isValidEmail(cleanEmail) || !RECOVERY_CODE_PATTERN.test(cleanCode)) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_RECOVERY_CODE_FORMAT',
      message: 'Informe um código de verificação válido com 6 dígitos.',
    });
  }

  const allCodes = loadVerificationCodes();
  const record = allCodes[cleanEmail];
  if (!record || !verifyRecoveryCode(cleanCode, record.codeHash)) {
    if (record) {
      const attempts = registerInvalidRecoveryAttempt(allCodes, cleanEmail, record);
      if (attempts >= 5) {
        return res.status(429).json({
          success: false,
          message: 'Número excessivo de tentativas incorretas. Solicite um novo código.',
        });
      }
    }
    return res.status(400).json({ success: false, message: 'Código de verificação inválido ou expirado.' });
  }

  return res.json({ success: true, message: 'Código validado com sucesso!' });
});

app.post('/api/reset-password', passwordResetLimiter, async (req, res) => {
  const cleanEmail = normalizeEmail(req.body?.email);
  const cleanCode = String(req.body?.code || '').trim();
  const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

  if (!isValidEmail(cleanEmail) || !RECOVERY_CODE_PATTERN.test(cleanCode)) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_RECOVERY_CODE_FORMAT',
      message: 'Informe um código de verificação válido com 6 dígitos.',
    });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      code: 'WEAK_PASSWORD',
      message: 'A nova senha deve ter pelo menos 8 caracteres.',
    });
  }

  const allCodes = loadVerificationCodes();
  const record = allCodes[cleanEmail];
  if (!record || !verifyRecoveryCode(cleanCode, record.codeHash)) {
    if (record) {
      const attempts = registerInvalidRecoveryAttempt(allCodes, cleanEmail, record);
      if (attempts >= 5) {
        return res.status(429).json({
          success: false,
          message: 'Número excessivo de tentativas incorretas. Solicite um novo código.',
        });
      }
    }
    return res.status(400).json({ success: false, message: 'Código de verificação inválido ou expirado.' });
  }

  if (!supabaseAdmin) {
    return res.status(503).json({
      success: false,
      message: 'Serviço de autenticação temporariamente indisponível.',
    });
  }

  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(record.userId, { password: newPassword });
    if (error) {
      return res.status(500).json({ success: false, message: 'Não foi possível atualizar a senha.' });
    }
  } catch (error) {
    console.error('[AUTH] Falha interna ao atualizar senha:', error.code || error.name);
    return res.status(500).json({ success: false, message: 'Não foi possível atualizar a senha.' });
  }

  delete allCodes[cleanEmail];
  saveVerificationCodes(allCodes);
  return res.json({ success: true, message: 'Sua senha foi redefinida com sucesso no Supabase Auth!' });
});

// 6. FAMILY INVITATION: POST /api/family/invite
const familyInviteLimiter = createRateLimiter({
  prefix: 'family-invite',
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: 'Limite de convites atingido. Aguarde alguns minutos antes de reenviar.',
});

app.post('/api/family/invite', authenticateToken, familyInviteLimiter, async (req, res) => {
  const memberName = String(req.body?.memberName || req.body?.name || '').trim();
  const rawEmail = String(req.body?.memberEmail || req.body?.email || '').trim();
  const cleanEmail = normalizeEmail(rawEmail);
  const relationshipType = req.body?.relationshipType || req.body?.type || 'linked';

  if (!memberName) {
    return res.status(400).json({ success: false, message: 'Informe o nome do membro convidado.' });
  }

  if (!isValidEmail(cleanEmail)) {
    return res.status(400).json({ success: false, message: 'Informe um endereço de e-mail válido para o convite.' });
  }

  const inviterId = req.user?.userId;
  const inviterEmail = req.user?.email || 'titular@finly.com';
  let inviterName = 'O titular da conta';

  // Buscar nome do titular na store local, se disponível
  try {
    const storePath = getUserStorePath(inviterId);
    if (fs.existsSync(storePath)) {
      const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      if (store?.user?.name) {
        inviterName = store.user.name.trim();
      }
    }
  } catch (_) {}

  // Carregar e renderizar template de e-mail oficial
  const templatePath = path.join(__dirname, 'email-templates', 'invite.html');
  let emailHtml = '';

  const inviteCode = crypto.randomInt(100_000, 1_000_000).toString();
  const confirmationUrl = `https://finly.lpaguiar.com.br/login?email=${encodeURIComponent(cleanEmail)}&invite=true`;

  if (fs.existsSync(templatePath)) {
    try {
      emailHtml = fs.readFileSync(templatePath, 'utf8');
      emailHtml = emailHtml
        .replace(/{{\s*\.ConfirmationURL\s*}}/g, confirmationUrl)
        .replace(/{{\s*\.Token\s*}}/g, inviteCode)
        .replace(
          'Você recebeu um convite para acessar a plataforma de gestão financeira inteligente Finly. Clique no botão abaixo para aceitar o convite e criar sua senha de acesso:',
          `<strong>${inviterName}</strong> convidou você para fazer parte do grupo familiar no Finly (${relationshipType === 'linked' ? 'Conta Vinculada com visão compartilhada' : 'Membro com gestão independente'}). Clique no botão abaixo para acessar o Finly e ativar sua participação:`
        );
    } catch (err) {
      console.warn('[FAMILY-INVITE] Falha ao ler template invite.html, usando fallback:', err.message);
    }
  }

  // Fallback caso o arquivo de template não exista ou falhe
  if (!emailHtml) {
    emailHtml = `
      <div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:24px;background:#14151d;color:#fff;border-radius:16px;">
        <h2 style="color:#a78bfa;">Convite para a Família Finly 🤝</h2>
        <p>Olá, <strong>${memberName}</strong>!</p>
        <p><strong>${inviterName}</strong> (${inviterEmail}) adicionou você ao grupo familiar do Finly.</p>
        <p><a href="${confirmationUrl}" style="display:inline-block;padding:12px 24px;background:#8b5cf6;color:#fff;text-decoration:none;border-radius:10px;font-weight:bold;">Aceitar Convite e Acessar</a></p>
        <p style="color:#94a3b8;font-size:12px;">Código de confirmação: <strong>${inviteCode}</strong></p>
      </div>
    `;
  }

  // Tentar notificar o Supabase Auth caso o usuário ainda não exista
  if (supabaseAdmin) {
    try {
      await supabaseAdmin.auth.admin.inviteUserByEmail(cleanEmail, {
        data: {
          name: memberName,
          invited_by: inviterId,
          invited_by_name: inviterName,
          relationship_type: relationshipType,
        },
      });
      console.log(`[FAMILY-INVITE] Convite registrado no Supabase Auth para: ${cleanEmail}`);
    } catch (sbErr) {
      // Se o usuário já existe no Supabase, apenas prosseguimos com o envio do e-mail informativo
      console.log(`[FAMILY-INVITE] Usuário já existente ou retorno Supabase: ${sbErr.message}`);
    }
  }

  // Enviar e-mail formatado via SMTP
  try {
    const senderEmail = process.env.SMTP_USER || 'suporte@finly.com';
    await transporter.sendMail({
      from: `"Finly" <${senderEmail}>`,
      to: cleanEmail,
      subject: `${inviterName} convidou você para a Família Finly! 🤝`,
      html: emailHtml,
    });
    console.log(`✅ [FAMILY-INVITE] E-mail de convite disparado com sucesso para ${cleanEmail} (convidado por ${inviterEmail})`);
    return res.json({
      success: true,
      message: `Convite enviado com sucesso para ${cleanEmail}!`,
    });
  } catch (mailError) {
    console.error('❌ [FAMILY-INVITE] Falha ao enviar e-mail via SMTP:', mailError);
    return res.status(500).json({
      success: false,
      message: 'Não foi possível disparar o e-mail de convite no momento. Verifique as configurações de e-mail.',
      error: mailError.message,
    });
  }
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
