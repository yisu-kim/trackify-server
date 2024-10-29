import { NextFunction, Request, Response } from "express";
import passport from "passport";

import jwt from "jsonwebtoken";

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

      req.logout({ keepSessionInfo: false }, () => {
        req.session.destroy(async () => {
          res.clearCookie(sessionConfig.name);

          // TODO: handle error

          const { ciphertextWithMeta, iv } = await encryptAccountAccessToken(
            user.providerAccountId,
            user.accessToken,
          );

          await updateAccountById(user.accountId, {
            access_token: ciphertextWithMeta,
          });

          const accessToken = generateAccessToken<{ id: number; iv: string }>({
            id: user.accountId,
            iv,
          });

          const decoded = jwt.decode(accessToken);
          if (decoded === null || typeof decoded === "string") {
            console.warn("Invalid token or token not decoded");
            return res.status(401).json({ message: "Authentication failed" });
          }

          const { exp: expInSeconds } = decoded;
          if (typeof expInSeconds !== "number") {
            console.warn("Token expiration 'exp' claim is missing");
            return res.status(401).json({ message: "Authentication failed" });
          }

          res.cookie(accessTokenConfig.name, accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            expires: new Date(expInSeconds * 1000),
          });

          return res.redirect(client.origin);
        });
      });
    },
  )(req, res, next);
}
