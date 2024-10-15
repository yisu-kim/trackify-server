import { Buffer } from "node:buffer";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scrypt,
} from "node:crypto";
import { promisify } from "node:util";

import { config } from "../config.js";

const {
  auth: { token, csrf },
} = config;

const ALGORITHM = "aes-256-gcm";

const scryptAsync = promisify(scrypt);

function deriveKeyForUser(userId: string, salt: string): Promise<Buffer> {
  const combined = `${token.secret}:${userId}`;
  return scryptAsync(combined, salt, 32) as Promise<Buffer>;
}

export async function encryptData(
  userId: string,
  plainData: string,
): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await deriveKeyForUser(userId, salt);
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainData, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  const result =
    iv.toString("hex") + encrypted + authTag.toString("hex") + salt;
  return result;
}

export async function decryptData(
  userId: string,
  encryptedData: string,
): Promise<string> {
  const iv = Buffer.from(encryptedData.slice(0, 32), "hex");
  const encrypted = encryptedData.slice(32, -64);
  const authTag = Buffer.from(encryptedData.slice(-64, -32), "hex");
  const salt = encryptedData.slice(-32);
  const key = await deriveKeyForUser(userId, salt);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function generateCsrfToken(): string {
  const salt = randomBytes(16).toString("hex");
  const csrfToken = createHash("sha256")
    .update(csrf.secret + salt)
    .digest("hex");

  return `${salt}$${csrfToken}`;
}

export function validateCsrfToken(csrfHeader: string) {
  const [salt, csrfTokenFromHeader] = csrfHeader.split("$");

  if (!salt || !csrfTokenFromHeader) {
    return false;
  }

  const csrfToken = createHash("sha256")
    .update(csrf.secret + salt)
    .digest("hex");

  return csrfTokenFromHeader === csrfToken;
}
