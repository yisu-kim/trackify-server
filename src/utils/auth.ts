import { Buffer } from "node:buffer";
import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import jwt, { JwtPayload, VerifyErrors } from "jsonwebtoken";

import { config } from "../config.js";
import { decrypt, encrypt } from "./crypto.js";

const {
  auth: {
    accessToken: accessTokenConfig,
    csrf: csrfConfig,
    cipher: cipherConfig,
  },
} = config;

const scryptAsync = promisify(scrypt);

function generateCipherSalt() {
  return randomBytes(cipherConfig.saltLength).toString("hex");
}

async function deriveCipherKey(id: string, salt: string): Promise<Buffer> {
  const combined = `${cipherConfig.secret}:${id}`;
  return scryptAsync(combined, salt, cipherConfig.keyLength) as Promise<Buffer>;
}

function combineCipherPack(
  ciphertext: string,
  authTag: string,
  salt: string,
): string {
  return ciphertext + authTag + salt;
}

function extractCipherPack(ciphertextWithMeta: string) {
  const authTagHexLength = cipherConfig.authTagLength * 2;
  const saltHexLength = cipherConfig.saltLength * 2;
  const totalMetaHexLength = authTagHexLength + saltHexLength;

  return {
    ciphertext: ciphertextWithMeta.slice(0, -totalMetaHexLength),
    authTag: ciphertextWithMeta.slice(-totalMetaHexLength, -saltHexLength),
    salt: ciphertextWithMeta.slice(-saltHexLength),
  };
}

export async function encryptAccountAccessToken(
  accountId: string,
  accessToken: string,
) {
  const salt = generateCipherSalt();
  const key = await deriveCipherKey(accountId, salt);

  const { iv, ciphertext, authTag } = await encrypt(key, accessToken);
  const ciphertextWithMeta = combineCipherPack(ciphertext, authTag, salt);
  return { ciphertextWithMeta, iv };
}

export async function decryptAccountAccessToken(
  accountId: string,
  iv: string,
  ciphertextWithMeta: string,
) {
  const { ciphertext, authTag, salt } = extractCipherPack(ciphertextWithMeta);
  const key = await deriveCipherKey(accountId, salt);

  const accessToken = decrypt(key, iv, ciphertext, authTag);
  return accessToken;
}

const CSRF_ALGORITHM = "sha256";

export function generateCsrfToken(): string {
  const salt = randomBytes(16).toString("hex");
  const csrfToken = createHmac(CSRF_ALGORITHM, csrfConfig.secret)
    .update(salt)
    .digest("hex");

  return `${salt}$${csrfToken}`;
}

export function validateCsrfToken(csrfHeader: string) {
  const [salt, csrfToken] = csrfHeader.split("$");

  if (!salt || !csrfToken) {
    return false;
  }

  const expected = createHmac(CSRF_ALGORITHM, csrfConfig.secret)
    .update(salt)
    .digest();
  const provided = Buffer.from(csrfToken, "hex");

  return timingSafeEqual(expected, provided);
}

export function generateAccessToken<T extends Record<string, unknown>>(
  payload: T,
) {
  return jwt.sign(payload, accessTokenConfig.secret, {
    expiresIn: accessTokenConfig.expiresInSeconds,
  });
}

export function validateAccessToken(token: string): Promise<JwtPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      accessTokenConfig.secret,
      { complete: false },
      (
        error: VerifyErrors | null,
        decoded: JwtPayload | string | undefined,
      ) => {
        if (error || !decoded || typeof decoded === "string") {
          return reject(error || new Error("Invalid token"));
        }
        resolve(decoded);
      },
    );
  });
}
