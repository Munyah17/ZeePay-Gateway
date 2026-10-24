import crypto from 'crypto';
import { config } from '../config';

const ALGORITHM = 'aes-256-gcm';

function deriveKey(): Buffer {
  return crypto.createHash('sha256').update(config.encryption.key).digest();
}

/**
 * Encrypt a JSON-serializable value for storage (e.g. provider credentials).
 * Format: base64(iv + authTag + ciphertext).
 */
export function encrypt(value: Record<string, any>): string {
  const key = deriveKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const plaintext = JSON.stringify(value);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

/**
 * Decrypt a value produced by encrypt(). Returns null if the value
 * cannot be decrypted (wrong key or corrupt payload).
 */
export function decrypt(encryptedValue: string): Record<string, any> | null {
  try {
    const key = deriveKey();
    const data = Buffer.from(encryptedValue, 'base64');
    const iv = data.subarray(0, 16);
    const authTag = data.subarray(16, 32);
    const ciphertext = data.subarray(32);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8'));
  } catch {
    return null;
  }
}
