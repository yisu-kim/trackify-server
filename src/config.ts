import dotenv from "dotenv";
dotenv.config();

function required<T>(key: string, defaultValue?: T): T {
  const value = process.env[key] || defaultValue;
  if (value == null) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value as T;
}

type Config = {
  port: number;
  cors: {
    allowedOrigin: string[];
  };
  db: {
    database: string;
    user: string;
    password: string;
    host: string;
  };
};

export const config: Config = {
  port: required<number>("PORT", 8080),
  cors: {
    allowedOrigin: required<string>("CORS_ALLOW_ORIGIN").split(","),
  },
  db: {
    database: required<string>("DB_DATABASE"),
    user: required<string>("DB_USER"),
    password: required<string>("DB_PASSWORD"),
    host: required<string>("DB_HOST"),
  },
};
