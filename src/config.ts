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
  port: string;
  db: {
    database: string;
    user: string;
    password: string;
    host: string;
  };
  auth: {
    token: {
      name: string;
      maxAge: number;
    };
    csrf: {
      name: string;
      secret: string;
    };
    session: {
      name: string;
      secret: string;
      maxAge: number;
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
  port: required<string>("PORT", "8080"),
  db: {
    database: required<string>("DB_DATABASE"),
    user: required<string>("DB_USER"),
    password: required<string>("DB_PASSWORD"),
    host: required<string>("DB_HOST"),
  },
  auth: {
    token: {
      name: required<string>("AUTH_TOKEN_COOKIE"),
      maxAge: 60 * 60 * 1000,
    },
    csrf: {
      name: required<string>("CSRF_TOKEN_COOKIE"),
      secret: required("CSRF_SECRET"),
    },
    session: {
      name: required<string>("AUTH_SESSION_COOKIE"),
      secret: required<string>("AUTH_SESSION_SECRET"),
      maxAge: 60 * 1000,
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
