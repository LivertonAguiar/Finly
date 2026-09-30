import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateSessionToken } from '../security/token.js';

const TEST_USER_ID = '11111111-1111-4111-8111-111111111111';
const TEST_EMAIL = 'security-test@example.invalid';
const INVALID_USER_TOKEN = 'supabase-invalid-user-id';
const VALID_USER_TOKEN = 'supabase-valid-user-id';
const LEGACY_SECRET = 'test-only-legacy-secret-with-32-bytes';
const GENERIC_RECOVERY_MESSAGE = 'Se existir uma conta para este e-mail, enviaremos as instruções de recuperação.';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(testDir, '..', '..');
const runtimeDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'finly-security-test-'));
const legacyVerificationFile = path.join(projectDir, 'server', 'data', 'verificationCodes.json');
const legacyVerificationSnapshot = fs.existsSync(legacyVerificationFile)
  ? fs.readFileSync(legacyVerificationFile)
  : null;
const touchedLegacyStores = [
  path.join(projectDir, 'server', 'data', 'stores', 'not-a-uuid.json'),
  path.join(projectDir, 'server', 'data', 'stores', `${TEST_USER_ID}.json`),
];
const legacyStoreSnapshots = new Map(
  touchedLegacyStores.map((storePath) => [storePath, fs.existsSync(storePath) ? fs.readFileSync(storePath) : null]),
);

const listen = (server) => new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => resolve(server.address().port));
});

const close = (server) => new Promise((resolve) => {
  if (!server.listening) return resolve();
  server.closeAllConnections?.();
  server.close(resolve);
  const fallback = setTimeout(resolve, 1_000);
  fallback.unref();
});

const readRequestBody = (req) => new Promise((resolve, reject) => {
  let body = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    if (!body) return resolve(null);
    try {
      resolve(JSON.parse(body));
    } catch (error) {
      reject(error);
    }
  });
  req.on('error', reject);
});

const supabaseRequests = [];
const supabaseServer = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, 'http://127.0.0.1');
  const body = await readRequestBody(req);
  supabaseRequests.push({ method: req.method, pathname: requestUrl.pathname, body });

  res.setHeader('Content-Type', 'application/json');

  if (requestUrl.pathname === '/auth/v1/user') {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (token === VALID_USER_TOKEN) {
      res.writeHead(200);
      return res.end(JSON.stringify({
        id: TEST_USER_ID,
        email: TEST_EMAIL,
        app_metadata: { role: 'user' },
        user_metadata: {},
        aud: 'authenticated',
      }));
    }
    if (token === INVALID_USER_TOKEN) {
      res.writeHead(200);
      return res.end(JSON.stringify({
        id: 'not-a-uuid',
        email: TEST_EMAIL,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
      }));
    }
    res.writeHead(401);
    return res.end(JSON.stringify({ message: 'invalid token' }));
  }

  if (requestUrl.pathname === '/auth/v1/admin/users' && req.method === 'GET') {
    res.writeHead(200);
    return res.end(JSON.stringify({
      users: [{
        id: TEST_USER_ID,
        email: TEST_EMAIL,
        app_metadata: { role: 'user' },
        user_metadata: {},
        aud: 'authenticated',
      }],
    }));
  }

  if (requestUrl.pathname === `/auth/v1/admin/users/${TEST_USER_ID}` && req.method === 'PUT') {
    res.writeHead(200);
    return res.end(JSON.stringify({
      id: TEST_USER_ID,
      email: TEST_EMAIL,
      app_metadata: { role: 'user' },
      user_metadata: {},
      aud: 'authenticated',
    }));
  }

  if (requestUrl.pathname.startsWith('/rest/v1/')) {
    res.writeHead(201);
    return res.end(JSON.stringify([]));
  }

  res.writeHead(404);
  return res.end(JSON.stringify({ message: 'not found' }));
});

const deliveredEmails = [];
const smtpSockets = new Set();
const smtpServer = net.createServer((socket) => {
  smtpSockets.add(socket);
  socket.once('close', () => smtpSockets.delete(socket));
  let buffer = '';
  let dataMode = false;
  let message = '';

  socket.setEncoding('utf8');
  socket.write('220 localhost Finly security test SMTP\r\n');
  socket.on('data', (chunk) => {
    buffer += chunk;
    while (buffer.includes('\r\n')) {
      const lineEnd = buffer.indexOf('\r\n');
      const line = buffer.slice(0, lineEnd);
      buffer = buffer.slice(lineEnd + 2);

      if (dataMode) {
        if (line === '.') {
          deliveredEmails.push(message);
          message = '';
          dataMode = false;
          socket.write('250 2.0.0 queued\r\n');
        } else {
          message += `${line}\r\n`;
        }
        continue;
      }

      if (/^(EHLO|HELO)\b/i.test(line)) {
        socket.write('250-localhost\r\n250 8BITMIME\r\n');
      } else if (/^(MAIL FROM|RCPT TO)\b/i.test(line)) {
        socket.write('250 2.1.0 ok\r\n');
      } else if (/^DATA\b/i.test(line)) {
        dataMode = true;
        socket.write('354 End data with <CR><LF>.<CR><LF>\r\n');
      } else if (/^QUIT\b/i.test(line)) {
        socket.write('221 2.0.0 bye\r\n');
        socket.end();
      } else if (/^NOOP\b/i.test(line)) {
        socket.write('250 2.0.0 ok\r\n');
      } else {
        socket.write('250 2.0.0 ok\r\n');
      }
    }
  });
});

const getUnusedPort = async () => {
  const probe = net.createServer();
  const port = await listen(probe);
  await close(probe);
  return port;
};

const waitForApi = async (baseUrl, child, logs) => {
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`API encerrou prematuramente (${child.exitCode}).\n${logs.join('')}`);
    }
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch (_) {}
    await new Promise((resolve) => setTimeout(resolve, 75));
  }
  throw new Error(`API não iniciou no prazo esperado.\n${logs.join('')}`);
};

const stopChild = async (child) => {
  if (!child || child.exitCode !== null) return;
  const exited = new Promise((resolve) => child.once('exit', resolve));
  child.kill();
  await Promise.race([
    exited,
    new Promise((resolve) => {
      const fallback = setTimeout(resolve, 2_000);
      fallback.unref();
    }),
  ]);
};

const postJson = (baseUrl, route, body, headers = {}) => fetch(`${baseUrl}${route}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...headers },
  body: JSON.stringify(body),
});

const restoreRuntimeFiles = () => {
  if (legacyVerificationSnapshot === null) {
    fs.rmSync(legacyVerificationFile, { force: true });
  } else {
    fs.writeFileSync(legacyVerificationFile, legacyVerificationSnapshot);
  }

  for (const [storePath, snapshot] of legacyStoreSnapshots) {
    if (snapshot === null) {
      fs.rmSync(storePath, { force: true });
    } else {
      fs.writeFileSync(storePath, snapshot);
    }
  }

  fs.rmSync(runtimeDataDir, { recursive: true, force: true });
};

let apiProcess;
try {
  const supabasePort = await listen(supabaseServer);
  const smtpPort = await listen(smtpServer);
  const apiPort = await getUnusedPort();
  const apiBaseUrl = `http://127.0.0.1:${apiPort}`;
  const childLogs = [];
  const childEnv = {
    ...process.env,
    VITE_SUPABASE_URL: `http://127.0.0.1:${supabasePort}`,
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    APP_SECRET: LEGACY_SECRET,
    SMTP_HOST: '127.0.0.1',
    SMTP_PORT: String(smtpPort),
    SMTP_SECURE: 'false',
    SMTP_USER: '',
    SMTP_PASS: '',
    FINLY_DATA_DIR: runtimeDataDir,
    FINLY_DISABLE_BACKGROUND_JOBS: 'true',
    NODE_ENV: 'test',
  };

  apiProcess = spawn(process.execPath, ['server/apiServer.js'], {
    cwd: projectDir,
    env: {
      ...childEnv,
      PORT: String(apiPort),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  apiProcess.stdout.on('data', (chunk) => childLogs.push(chunk.toString()));
  apiProcess.stderr.on('data', (chunk) => childLogs.push(chunk.toString()));
  await waitForApi(apiBaseUrl, apiProcess, childLogs);

  const oversizedRecoveryResponse = await postJson(apiBaseUrl, '/api/send-recovery-code', {
    email: 'oversized@example.invalid',
    padding: 'x'.repeat(9 * 1024 * 1024),
  });
  assert.equal(oversizedRecoveryResponse.status, 413, 'corpos acima de 8 MiB devem ser recusados antes das rotas');

  const invalidIdentityResponse = await postJson(apiBaseUrl, '/api/user/store', { store: { cards: [] } }, {
    Authorization: `Bearer ${INVALID_USER_TOKEN}`,
  });
  assert.equal(invalidIdentityResponse.status, 401, 'um ID Supabase que não é UUID deve falhar fechado');
  assert.equal(
    fs.existsSync(path.join(runtimeDataDir, 'stores', 'not-a-uuid.json')),
    false,
    'uma identidade inválida não pode criar store local',
  );

  const validIdentityResponse = await postJson(apiBaseUrl, '/api/user/store', {
    store: {
      cards: [{ id: crypto.randomUUID(), name: 'Cartão de teste' }],
      accounts: [{ id: crypto.randomUUID(), name: 'Conta de teste' }],
    },
  }, {
    Authorization: `Bearer ${VALID_USER_TOKEN}`,
  });
  assert.equal(validIdentityResponse.status, 200, 'um usuário Supabase válido deve conseguir sincronizar');
  await new Promise((resolve) => setTimeout(resolve, 150));

  const persistedRows = supabaseRequests
    .filter(({ pathname }) => pathname.startsWith('/rest/v1/'))
    .flatMap(({ body }) => Array.isArray(body) ? body : []);
  assert.ok(persistedRows.length >= 2, 'o teste deve observar os upserts administrativos');
  assert.ok(
    persistedRows.every((row) => row.user_id === TEST_USER_ID),
    'todo upsert deve derivar user_id do UUID autenticado, sem UUID padrão',
  );

  const queryTokenResponse = await fetch(`${apiBaseUrl}/api/sync/events?token=${VALID_USER_TOKEN}`);
  assert.equal(queryTokenResponse.status, 401, 'o stream não deve aceitar credenciais na URL');
  await queryTokenResponse.body?.cancel();

  const legacyToken = generateSessionToken({ userId: TEST_USER_ID, email: TEST_EMAIL }, LEGACY_SECRET);
  const legacyResponse = await fetch(`${apiBaseUrl}/api/user/store`, {
    headers: { Authorization: `Bearer ${legacyToken}` },
  });
  assert.equal(legacyResponse.status, 401, 'tokens HMAC legados devem ficar desativados por padrão');

  const unknownRecoveryResponse = await postJson(apiBaseUrl, '/api/send-recovery-code', {
    email: 'unknown-security-test@example.invalid',
  });
  const unknownRecoveryPayload = await unknownRecoveryResponse.json();
  assert.equal(unknownRecoveryResponse.status, 200, 'a recuperação não deve revelar e-mail inexistente pelo status');
  assert.equal(unknownRecoveryPayload.message, GENERIC_RECOVERY_MESSAGE);

  const knownRecoveryResponse = await postJson(apiBaseUrl, '/api/send-recovery-code', { email: TEST_EMAIL });
  const knownRecoveryPayload = await knownRecoveryResponse.json();
  assert.equal(knownRecoveryResponse.status, 200);
  assert.equal(knownRecoveryPayload.message, GENERIC_RECOVERY_MESSAGE);

  assert.equal(deliveredEmails.length, 1, 'a conta existente deve receber exatamente um e-mail');
  const codeMatch = deliveredEmails[0].match(/>(\d{6})</u);
  assert.ok(codeMatch, 'o e-mail deve conter um código de exatamente seis dígitos');
  const recoveryCode = codeMatch[1];

  const recoveryStorePath = path.join(runtimeDataDir, 'verificationCodes.json');
  const recoveryStoreRaw = fs.readFileSync(recoveryStorePath, 'utf8');
  const recoveryStore = JSON.parse(recoveryStoreRaw);
  assert.equal(recoveryStoreRaw.includes(recoveryCode), false, 'o código nunca deve ser persistido em texto puro');
  assert.equal(
    Object.values(recoveryStore).every((record) => record.codeHash && !('code' in record)),
    true,
    'o armazenamento deve conter somente hash salgado do código',
  );
  assert.equal(childLogs.join('').includes(recoveryCode), false, 'o código nunca deve aparecer nos logs');

  let firstForwardedIpWasLimited = false;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await postJson(apiBaseUrl, '/api/send-recovery-code', {
      email: 'forwarded-limit@example.invalid',
    }, { 'X-Forwarded-For': '203.0.113.10' });
    if (response.status === 429) firstForwardedIpWasLimited = true;
  }
  assert.equal(firstForwardedIpWasLimited, true, 'o IP encaminhado pelo proxy deve receber limite próprio');
  const secondForwardedIpResponse = await postJson(apiBaseUrl, '/api/send-recovery-code', {
    email: 'forwarded-independent@example.invalid',
  }, { 'X-Forwarded-For': '203.0.113.11' });
  assert.equal(secondForwardedIpResponse.status, 200, 'um segundo IP encaminhado não deve herdar o limite do primeiro');

  const fiveDigitResponse = await postJson(apiBaseUrl, '/api/verify-code', {
    email: TEST_EMAIL,
    code: recoveryCode.slice(0, 5),
  });
  assert.equal(fiveDigitResponse.status, 400, 'prefixos de cinco dígitos não podem ser aceitos');

  const exactCodeResponse = await postJson(apiBaseUrl, '/api/verify-code', {
    email: TEST_EMAIL,
    code: recoveryCode,
  });
  assert.equal(exactCodeResponse.status, 200, 'somente o código exato de seis dígitos deve validar');

  let verifyRateLimited = false;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await postJson(apiBaseUrl, '/api/verify-code', {
      email: 'rate-limit@example.invalid',
      code: '000000',
    });
    if (response.status === 429) verifyRateLimited = true;
  }
  assert.equal(verifyRateLimited, true, 'a verificação de código deve ter limitador próprio');

  const resetResponse = await postJson(apiBaseUrl, '/api/reset-password', {
    email: TEST_EMAIL,
    code: recoveryCode,
    newPassword: 'SecurePass123!',
  });
  assert.equal(resetResponse.status, 200, 'o reset compatível deve atualizar a senha via Supabase Admin');
  assert.ok(
    supabaseRequests.some(({ method, pathname, body }) => (
      method === 'PUT'
      && pathname === `/auth/v1/admin/users/${TEST_USER_ID}`
      && body?.password === 'SecurePass123!'
    )),
    'a senha deve ser atualizada apenas no usuário Supabase associado ao código',
  );

  let resetRateLimited = false;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await postJson(apiBaseUrl, '/api/reset-password', {
      email: 'rate-limit@example.invalid',
      code: '000000',
      newPassword: 'SecurePass123!',
    });
    if (response.status === 429) resetRateLimited = true;
  }
  assert.equal(resetRateLimited, true, 'a redefinição de senha deve ter limitador próprio');

  await stopChild(apiProcess);
  const compatibilityPort = await getUnusedPort();
  const compatibilityBaseUrl = `http://127.0.0.1:${compatibilityPort}`;
  const compatibilityLogs = [];
  apiProcess = spawn(process.execPath, ['server/apiServer.js'], {
    cwd: projectDir,
    env: {
      ...childEnv,
      PORT: String(compatibilityPort),
      ALLOW_LEGACY_SESSION_TOKENS: 'true',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  apiProcess.stdout.on('data', (chunk) => compatibilityLogs.push(chunk.toString()));
  apiProcess.stderr.on('data', (chunk) => compatibilityLogs.push(chunk.toString()));
  await waitForApi(compatibilityBaseUrl, apiProcess, compatibilityLogs);

  const optedInLegacyResponse = await fetch(`${compatibilityBaseUrl}/api/user/store`, {
    headers: { Authorization: `Bearer ${legacyToken}` },
  });
  assert.equal(optedInLegacyResponse.status, 200, 'o fallback legado deve funcionar somente com opt-in e segredo forte');

  console.log('OK: identidade Supabase, recuperação e compatibilidade HTTP protegidas.');
} finally {
  await stopChild(apiProcess);
  smtpSockets.forEach((socket) => socket.destroy());
  await Promise.allSettled([close(supabaseServer), close(smtpServer)]);
  restoreRuntimeFiles();
}
