import crypto from 'crypto';

/**
 * Derives a secure cryptographic hash for a password using Scrypt + Salt.
 * Format: scrypt$<salt_hex>$<hash_hex>
 *
 * @param {string} password - The plain-text password to hash
 * @returns {string} - The salted scrypt hash
 */
export function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a valid non-empty string');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
  });
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

/**
 * Verifies a password against a stored cryptographic hash or legacy value.
 * Uses timing-safe equality to prevent side-channel timing attacks.
 *
 * @param {string} password - The candidate plain-text password
 * @param {string} storedHash - The stored hash in format scrypt$<salt>$<hash>
 * @returns {boolean} - True if password matches, false otherwise
 */
export function verifyPassword(password, storedHash) {
  if (!password || !storedHash || typeof password !== 'string' || typeof storedHash !== 'string') {
    return false;
  }

  // If already in scrypt format
  if (storedHash.startsWith('scrypt$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 3) return false;
    const [, salt, expectedHashHex] = parts;

    try {
      const derivedKey = crypto.scryptSync(password, salt, 64, {
        N: 16384,
        r: 8,
        p: 1,
      });
      const derivedHex = derivedKey.toString('hex');

      const bufA = Buffer.from(derivedHex, 'utf8');
      const bufB = Buffer.from(expectedHashHex, 'utf8');

      if (bufA.length !== bufB.length) return false;
      return crypto.timingSafeEqual(bufA, bufB);
    } catch (err) {
      return false;
    }
  }

  // Fallback for legacy plain-text during one-time migration
  return password === storedHash;
}

/**
 * Checks whether a given string is already hashed.
 *
 * @param {string} str
 * @returns {boolean}
 */
export function isHashed(str) {
  return typeof str === 'string' && str.startsWith('scrypt$');
}
