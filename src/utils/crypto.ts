import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { config } from "../config.js";

const {
  auth: { cipher: cipherConfig },
} = config;

export async function encrypt(key: Buffer, plainText: string) {
  if (key.length !== cipherConfig.keyLength) {
    throw new Error(
      `Invalid key length: Key must be ${cipherConfig.keyLength} bytes for ${cipherConfig.algorithm}.`,
    );
  }

  const iv = randomBytes(cipherConfig.ivLength);
  const cipher = createCipheriv(cipherConfig.algorithm, key, iv);
  let ciphertext = cipher.update(plainText, "utf8", "hex");
  ciphertext += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("hex"),
    ciphertext,
    authTag: authTag.toString("hex"),
  };
}

export async function decrypt(
  key: Buffer,
  iv: string,
  ciphertext: string,
  authTag: string,
) {
  if (key.length !== cipherConfig.keyLength) {
    throw new Error(
      `Invalid key length: Key must be ${cipherConfig.keyLength} bytes for ${cipherConfig.algorithm}.`,
    );
  }

  const decipher = createDecipheriv(
    cipherConfig.algorithm,
    key,
    Buffer.from(iv, "hex"),
  );
  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  let plainText = decipher.update(ciphertext, "hex", "utf8");
  plainText += decipher.final("utf8");

  return plainText;
}
