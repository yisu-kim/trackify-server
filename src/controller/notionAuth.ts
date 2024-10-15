import { NextFunction, Request, Response } from "express";
import passport from "passport";
import { config } from "../config.js";
import { encryptData } from "../utils/crypto.js";
import { notionStrategy } from "./notionStrategy.js";

const {
  client,
  auth: { token, session },
} = config;

const provider = "notion";

passport.use(provider, notionStrategy);

export function initiate(req: Request, res: Response, next: NextFunction) {
  passport.authenticate(
    provider,
    { session: false },
    function (
      err: unknown | null,
      user: { accessToken: string } | undefined,
      info: { message: string } | undefined,
    ) {
      if (err) {
        console.error(`Authentication error: ${err}`);
        return next(err);
      }
      if (!user) {
        return res
          .status(401)
          .json({ message: info?.message || "Authentication failed" });
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
    provider,
    { session: false },
    (
      err: unknown | null,
      user: { id: string; accessToken: string } | undefined,
      info: { message: string } | undefined,
    ) => {
      if (err) {
        console.error(`Authentication error: ${err}`);
        return next(err);
      }
      if (!user) {
        return res
          .status(401)
          .json({ message: info?.message || "Authentication failed" });
      }

      req.logout({ keepSessionInfo: false }, () => {
        req.session.destroy(async () => {
          res.clearCookie(session.name);

          const encrypted = await encryptData(user.id, user.accessToken);
          res.cookie(token.name, JSON.stringify({ id: user.id, encrypted }), {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: token.maxAge,
          });

          return res.redirect(client.origin);
        });
      });
    },
  )(req, res, next);
}
