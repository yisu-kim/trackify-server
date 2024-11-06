import { NextFunction, Request, Response } from "express";

import { config } from "../config.js";
import { validateAccessToken, validateCsrfToken } from "../utils/auth.js";
import { userService } from "../service/user.js";
import { accountService } from "../service/account.js";

const {
  auth: { accessToken: accessTokenConfig, csrf: csrfConfig },
} = config;

export async function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const accessToken = req.cookies[accessTokenConfig.name];

  if (!accessToken) {
    console.warn("No authentication token found.");
    return res.status(401).json({ message: "Authentication failed" });
  }

  try {
    const decoded = await validateAccessToken(accessToken);
    const { id, iv } = decoded;

    const isUserExists = await userService.isExists(id);
    if (!isUserExists) {
      console.warn("User not found.");
      return res.status(401).json({ message: "Authentication failed" });
    }

    const isAccountExists = await accountService.isExists(id);
    if (!isAccountExists) {
      console.warn("Account not found.");
      return res.status(401).json({ message: "Authentication failed" });
    }

    req.currentUser = { ...req.currentUser, id, iv };
    next();
  } catch (error) {
    console.warn(`Authentication error: ${error}`);
    return res.status(401).json({ message: "Authentication failed" });
  }
}

export function checkCsrf(req: Request, res: Response, next: NextFunction) {
  if (
    req.method === "GET" ||
    req.method === "OPTIONS" ||
    req.method === "HEAD"
  ) {
    next();
    return;
  }

  const csrfHeader = req.get(csrfConfig.name);

  if (!csrfHeader) {
    console.warn(`Missing required ${csrfConfig.name} header.`);
    return res.status(403).json({ message: "Failed CSRF check" });
  }

  try {
    const isValid = validateCsrfToken(csrfHeader);
    if (!isValid) {
      console.warn(
        `Value provided in ${csrfConfig.name} header does not validate.`,
      );
      return res.status(403).json({ message: "Failed CSRF check" });
    }
    next();
  } catch (error) {
    console.warn(`CSRF check error: ${error}`);
    return res.status(500).json({ message: "Something went wrong" });
  }
}
