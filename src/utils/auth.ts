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
  return JSON.stringify({ ciphertext, authTag, salt });
}

function extractCipherPack(ciphertextWithMeta: string) {
  const { ciphertext, authTag, salt } = JSON.parse(ciphertextWithMeta);

  if (
    authTag.length !== cipherConfig.authTagLength * 2 ||
    salt.length !== cipherConfig.saltLength * 2
  ) {
    throw new Error("Invalid cipher pack format");
  }

  return { ciphertext, authTag, salt };
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

export function generateCsrfToken(): string {
  const salt = randomBytes(16).toString("hex");
  const csrfToken = createHmac(csrfConfig.algorithm, csrfConfig.secret)
    .update(salt)
    .digest("hex");

  return `${salt}$${csrfToken}`;
}

export function validateCsrfToken(csrfHeader: string) {
  const [salt, csrfToken] = csrfHeader.split("$");

  if (!salt || !csrfToken) {
    return false;
  }

  const expected = createHmac(csrfConfig.algorithm, csrfConfig.secret)
    .update(salt)
    .digest();
  const provided = Buffer.from(csrfToken, "hex");

  return timingSafeEqual(expected, provided);
}

export function generateAccessToken<T extends Record<string, unknown>>(
  payload: T,
) {
  return jwt.sign(payload, accessTokenConfig.secret, {
    algorithm: accessTokenConfig.algorithm,
    expiresIn: accessTokenConfig.expiresInSeconds,
  });
}

export function validateAccessToken(token: string): Promise<JwtPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      accessTokenConfig.secret,
      { algorithms: [accessTokenConfig.algorithm], complete: false },
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
