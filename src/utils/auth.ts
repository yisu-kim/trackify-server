import { Buffer } from "node:buffer";
import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import jwt, { JwtPayload, VerifyErrors } from "jsonwebtoken";

import { config } from "../config.js";
import { findOrCreateUser } from "../repository/user.js";
import { findAccountByUserId } from "../repository/account.js";
import { useVerificationToken } from "../repository/verificationToken.js";
import { decrypt, encrypt } from "./crypto.js";

const {
  auth: {
    verificationToken: verificationTokenConfig,
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
  iv: string,
  ciphertext: string,
  authTag: string,
  salt: string,
): string {
  return JSON.stringify({ iv, ciphertext, authTag, salt });
}

function extractCipherPack(ciphertextWithMeta: string) {
  const { iv, ciphertext, authTag, salt } = JSON.parse(ciphertextWithMeta);

  if (
    iv.length !== cipherConfig.ivLength * 2 ||
    authTag.length !== cipherConfig.authTagLength * 2 ||
    salt.length !== cipherConfig.saltLength * 2
  ) {
    throw new Error("Invalid cipher pack format");
  }

  return { iv, ciphertext, authTag, salt };
}

export async function encryptAccountAccessToken(
  accountId: string,
  accessToken: string,
) {
  const salt = generateCipherSalt();
  const key = await deriveCipherKey(accountId, salt);

  const { iv, ciphertext, authTag } = await encrypt(key, accessToken);
  const ciphertextWithMeta = combineCipherPack(iv, ciphertext, authTag, salt);
  return ciphertextWithMeta;
}

export async function decryptAccountAccessToken(
  accountId: string,
  ciphertextWithMeta: string,
) {
  const { iv, ciphertext, authTag, salt } =
    extractCipherPack(ciphertextWithMeta);
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
  const token = jwt.sign(payload, accessTokenConfig.secret, {
    algorithm: accessTokenConfig.algorithm,
    expiresIn: accessTokenConfig.expiresInSeconds,
  });
  return {
    token,
    expiresInSeconds: accessTokenConfig.expiresInSeconds,
  };
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

export function generateVerificationToken<T extends Record<string, unknown>>(
  payload: T,
) {
  const token = jwt.sign(payload, verificationTokenConfig.secret, {
    algorithm: verificationTokenConfig.algorithm,
    expiresIn: verificationTokenConfig.expiresInSeconds,
  });
  return {
    token,
    expiresInSeconds: verificationTokenConfig.expiresInSeconds,
  };
}

export async function validateVerificationToken(token: string): Promise<{
  id: number;
  email: string;
  accountId?: number;
} | null> {
  try {
    const decoded = jwt.verify(token, verificationTokenConfig.secret, {
      algorithms: [verificationTokenConfig.algorithm],
      complete: false,
    });

    if (!decoded || typeof decoded === "string") {
      throw new Error("Invalid token");
    }

    await useVerificationToken({
      identifier: decoded.email,
      token,
    });

    const { user } = await findOrCreateUser({
      name: decoded.name || null,
      email: decoded.email,
      email_verified: new Date(),
    });

    const account = await findAccountByUserId(user.id);

    return {
      id: user.id,
      email: user.email,
      accountId: account?.dataValues.id,
    };
  } catch (error) {
    console.error("Magic link verification failed:", error);
    return null;
  }
}
