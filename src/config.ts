import dotenv from "dotenv";
import { Algorithm } from "jsonwebtoken";

dotenv.config();

// Declared type for CipherGCMTypes, as it's only defined internally in Node.js modules.
// When used with createCipheriv or createDecipheriv, this type infers a CipherGCM return type.
type CipherGCMTypes = "aes-128-gcm" | "aes-192-gcm" | "aes-256-gcm";

function required<T>(key: string, defaultValue?: T): T {
  const value = process.env[key] || defaultValue;
  if (value == null) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value as T;
}

type Config = {
  origin: string;
  port: number;
  db: {
    database: string;
    user: string;
    password: string;
    host: string;
    schema: string;
  };
  auth: {
    verificationToken: {
      algorithm: Algorithm;
      secret: string;
      expiresInSeconds: number;
      sender: string;
    };
    accessToken: {
      algorithm: Algorithm;
      name: string;
      secret: string;
      expiresInSeconds: number;
    };
    csrf: {
      algorithm: string;
      name: string;
      secret: string;
    };
    session: {
      name: string;
      secret: string;
      maxAge: number;
    };
    cipher: {
      algorithm: CipherGCMTypes;
      secret: string;
      saltLength: number;
      keyLength: number;
      ivLength: number;
      authTagLength: number;
    };
    provider: {
      notion: {
        id: string;
        secret: string;
        redirectUri: string;
        tokenUrl: string;
        authorizationURL: string;
      };
    };
  };
  client: {
    origin: string;
  };
};

export const config: Config = {
  origin: required<string>("ORIGIN"),
  port: required<number>("PORT", 8080),
  db: {
    database: required<string>("DB_DATABASE"),
    user: required<string>("DB_USER"),
    password: required<string>("DB_PASSWORD"),
    host: required<string>("DB_HOST"),
    schema: required<string>("DB_SCHEMA"),
  },
  auth: {
    verificationToken: {
      algorithm: required<Algorithm>("VERITIFACTION_TOKEN_ALGORITHM"),
      secret: required<string>("VERITIFACTION_TOKEN_SECRET"),
      expiresInSeconds: 10 * 60,
      sender: required<string>("VERITIFACTION_TOKEN_SENDER"),
    },
    accessToken: {
      algorithm: required<Algorithm>("ACCESS_TOKEN_ALGORITHM"),
      name: required<string>("ACCESS_TOKEN_COOKIE"),
      secret: required<string>("ACCESS_TOKEN_SECRET"),
      expiresInSeconds: 60 * 60,
    },
    csrf: {
      algorithm: required<string>("CSRF_ALGORITHM"),
      name: required<string>("CSRF_TOKEN_COOKIE"),
      secret: required<string>("CSRF_SECRET"),
    },
    session: {
      name: required<string>("AUTH_SESSION_COOKIE"),
      secret: required<string>("AUTH_SESSION_SECRET"),
      maxAge: 60 * 1000,
    },
    cipher: {
      algorithm: required<CipherGCMTypes>("CIPHER_ALGORITHM"),
      secret: required<string>("CIPHER_KEY_SECRET"),
      saltLength: 16,
      keyLength: 32,
      ivLength: 16,
      authTagLength: 16,
    },
    provider: {
      notion: {
        id: required<string>("AUTH_NOTION_ID"),
        secret: required<string>("AUTH_NOTION_SECRET"),
        redirectUri: required<string>("AUTH_NOTION_REDIRECT_URI"),
        tokenUrl: required<string>("AUTH_NOTION_TOKEN_URL"),
        authorizationURL: required<string>("AUTH_NOTION_AUTHORIZATION_URL"),
      },
    },
  },
  client: {
    origin: required<string>("CLIENT_ORIGIN"),
  },
};
