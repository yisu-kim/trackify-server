import dotenv from "dotenv";
dotenv.config();

function required(key: string, defaultValue?: string) {
  const value = process.env[key] || defaultValue;
  if (value == null) {
    throw new Error(`Key ${key} is undefined`);
  }
  return value;
}

export const config = {
  port: required("PORT", "8080"),
  cors: {
    allowedOrigin: required("CORS_ALLOW_ORIGIN"),
  },
  db: {
    database: required("DB_DATABASE"),
    user: required("DB_USER"),
    password: required("DB_PASSWORD"),
    host: required("DB_HOST"),
  },
};
