import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (secret) {
    const keyBuf = Buffer.from(secret, "base64");
    if (keyBuf.length === 32) return keyBuf;
  }
  const fallback = process.env.BETTER_AUTH_SECRET?.trim();
  if (fallback) return crypto.createHash("sha256").update(fallback).digest();
  throw new Error("ENCRYPTION_KEY environment variable is not set");
}

/**
 * Encrypts plaintext string using AES-256-GCM.
 * Output format: base64(iv [12B] || tag [16B] || ciphertext)
 */
export function encrypt(plain: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  // Combine iv + tag + ciphertext
  const combined = Buffer.concat([iv, tag, encrypted]);
  return combined.toString("base64");
}

/**
 * Decrypts a base64 blob containing iv + tag + ciphertext.
 */
export function decrypt(blob: string): string {
  const key = getKey();
  const buffer = Buffer.from(blob, "base64");

  if (buffer.length < IV_LENGTH + 16) {
    throw new Error("Invalid ciphertext: blob is too short");
  }

  const iv = buffer.subarray(0, IV_LENGTH);
  const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + 16);
  const ciphertext = buffer.subarray(IV_LENGTH + 16);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Masks an API key for safe UI display (e.g. "AIza••••••••9xQ2")
 */
export function mask(plain: string): string {
  if (!plain) return "";
  if (plain.length <= 8) return "••••••••";
  const start = plain.slice(0, 4);
  const end = plain.slice(-4);
  return `${start}••••••••${end}`;
}
