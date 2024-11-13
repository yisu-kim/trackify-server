import { NextFunction, Request, Response } from "express";
import passport from "passport";

import { config } from "../config.js";
import {
  encryptAccountAccessToken,
  generateAccessToken,
} from "../utils/auth.js";
import { updateAccountById } from "../repository/account.js";
import { User } from "./auth.js";
import { notionStrategy } from "./notionStrategy.js";

const {
  client,
  auth: { session: sessionConfig, accessToken: accessTokenConfig },
  cookie: cookieConfig,
} = config;

const PROVIDER_NAME = "notion";

passport.use(PROVIDER_NAME, notionStrategy);

export function initiate(req: Request, res: Response, next: NextFunction) {
  passport.authenticate(
    PROVIDER_NAME,
    { session: false },
    function (
      err: unknown | null,
      user: User | undefined,
      info: { message: string } | undefined,
    ) {
      if (err) {
        console.error(`Authentication error: ${err}`);
        return next(err);
      }
      if (!user) {
        console.error(`Unable to retrieve user: ${info?.message}`);
        return res.status(401).json({ message: "Authentication failed" });
      }

      next();
    },
  )(req, res, next);
}

export function handleCallback(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  passport.authenticate(
    PROVIDER_NAME,
    { session: false },
    async function (
      err: unknown | null,
      user: User | undefined,
      info: { message: string } | undefined,
    ) {
      if (err) {
        console.error(`Authentication error: ${err}`);
        return next(err);
      }
      if (!user) {
        console.error(`Unable to retrieve user: ${info?.message}`);
        return res.status(401).json({ message: "Authentication failed" });
      }

      try {
        await cleanupOAuthSession(req, res);

        const ciphertextWithMeta = await encryptAccountAccessToken(
          user.providerAccountId,
          user.accessToken,
        );
        await updateAccountById(user.accountId, {
          access_token: ciphertextWithMeta,
        });

        const { token: accessToken, expiresInSeconds } = generateAccessToken<{
          userId: number;
          accountId: number;
        }>({ userId: user.userId, accountId: user.accountId });

        res.cookie(accessTokenConfig.name, accessToken, {
          ...cookieConfig,
          expires: new Date(Date.now() + expiresInSeconds * 1000),
        });

        return res.redirect(client.origin);
      } catch (error) {
        console.error("Authentication error: ", error);
        return res.status(500).json({ message: "Something went wrong" });
      }
    },
  )(req, res, next);
}

async function cleanupOAuthSession(req: Request, res: Response): Promise<void> {
  return new Promise((resolve, reject) => {
    req.logout({ keepSessionInfo: false }, (error) => {
      if (error) reject(error);
      req.session.destroy((error) => {
        if (error) reject(error);

        try {
          res.clearCookie(sessionConfig.name);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  });
}
