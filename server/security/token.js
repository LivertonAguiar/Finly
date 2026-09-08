import crypto from 'crypto';

/**
 * Encodes a JSON object or buffer to URL-safe Base64.
 *
 * @param {object|string} data
 * @returns {string}
 */
function base64UrlEncode(data) {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  return Buffer.from(str, 'utf8')
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Decodes a URL-safe Base64 string to utf8 string.
 *
 * @param {string} b64Url
 * @returns {string}
 */
function base64UrlDecode(b64Url) {
  let str = b64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf8');
}

/**
 * Creates a timing-safe HMAC-SHA256 signature.
 *
 * @param {string} data
 * @param {string} secret
 * @returns {string}
 */
function signData(data, secret) {
  return crypto.createHmac('sha256', secret).update(data).digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Generates a signed cryptographic session token.
 * Format: <header_b64>.<payload_b64>.<signature_b64>
 *
 * @param {object} payload - User claims (userId, email, role, etc.)
 * @param {string} secret - Server secret key
 * @param {number} expiresInSeconds - Token lifetime in seconds (default 30 days)
 * @returns {string}
 */
export function generateSessionToken(payload, secret, expiresInSeconds = 30 * 24 * 60 * 60) {
  if (!secret) throw new Error('Secret key is required for token generation');

  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(fullPayload);
  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  const signature = signData(dataToSign, secret);

  return `${dataToSign}.${signature}`;
}

/**
 * Verifies a signed cryptographic session token.
 * Uses timing-safe comparison to protect against side-channel attacks.
 *
 * @param {string} token - The Bearer token to verify
 * @param {string} secret - Server secret key
 * @returns {{ valid: boolean, payload?: object, error?: string }}
 */
export function verifySessionToken(token, secret) {
  if (!token || typeof token !== 'string' || !secret) {
    return { valid: false, error: 'Token ou chave secreta ausente' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Formato de token inválido' };
  }

  const [encodedHeader, encodedPayload, expectedSignature] = parts;
  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  const computedSignature = signData(dataToSign, secret);

  // Timing-safe verification
  const bufExpected = Buffer.from(expectedSignature, 'utf8');
  const bufComputed = Buffer.from(computedSignature, 'utf8');

  if (bufExpected.length !== bufComputed.length || !crypto.timingSafeEqual(bufExpected, bufComputed)) {
    return { valid: false, error: 'Assinatura do token inválida' };
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Token expirado' };
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: 'Falha ao decodificar payload do token' };
  }
}
