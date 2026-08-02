import * as crypto from 'crypto';

const ALGO = 'aes-256-gcm';

function getKey(): Buffer {
  const raw = process.env.EMAIL_ENCRYPTION_KEY || process.env.SECRET_KEY;
  if (!raw) {
    throw new Error(
      'EMAIL_ENCRYPTION_KEY is required to encrypt the Azure client secret. Set it in the email-service environment.',
    );
  }
  // Derive a 32-byte key from any-length secret.
  return crypto.createHash('sha256').update(String(raw)).digest();
}

export function encryptSecret(plaintext: string): string {
  if (!plaintext) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join('.');
}

export function decryptSecret(payload: string): string {
  if (!payload) return '';
  const parts = String(payload).split('.');
  if (parts.length !== 3) return payload;
  try {
    const [ivB64, tagB64, dataB64] = parts;
    const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch {
    // Not encrypted (legacy) or bad key — return as-is so callers can decide.
    return payload;
  }
}
