import { Buffer } from "node:buffer";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { getFromCache, setToCache } from "./cache.js";
import { config } from "../config.js";

const {
  auth: { csrf },
} = config;

const ALGORITHM = "aes-256-gcm";

interface CachedData {
  key: Buffer;
  iv: Buffer;
  authTag: Buffer;
}

export function encryptData(userId: string, plainData: string): string {
  const key = randomBytes(32);
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainData, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  setToCache(userId, { key, iv, authTag });

  return encrypted;
}

export function decryptData(userId: string, encryptedData: string): string {
  const cachedData = getFromCache<CachedData>(userId);
  if (!cachedData) {
    throw new Error("Unable to find data required for decryption.");
  }

  const { key, iv, authTag } = cachedData;
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData, "hex", "utf8");
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
