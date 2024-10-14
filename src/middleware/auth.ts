import { NextFunction, Request, Response } from "express";
import { config } from "../config.js";
import { decryptData, validateCsrfToken } from "../utils/crypto.js";

const {
  auth: { csrf, token },
} = config;

export function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authToken = req.cookies[token.name];

  if (!authToken) {
    console.warn("No authentication token found");
    res.status(401).json({ message: "Authentication failed" });
    return;
  }

  try {
    const { id, encrypted } = JSON.parse(authToken);
    const decrypted = decryptData(id, encrypted);
    if (!decrypted) {
      console.warn("Failed to decrypt token.");
      res.status(401).json({ message: "Authentication failed" });
      return;
    }

    req.user = { id, token: decrypted };
    next();
  } catch (err) {
    console.warn(`Authentication error: ${err}`);
    res.status(500).json({ message: "Something went wrong" });
    return;
  }
}

export const checkCsrf = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (
    req.method === "GET" ||
    req.method === "OPTIONS" ||
    req.method === "HEAD"
  ) {
    next();
    return;
  }

  const csrfHeader = req.get(csrf.name);

  if (!csrfHeader) {
    console.warn(`Missing required ${csrf.name} header.`, req.headers.origin);
    res.status(403).json({ message: "Failed CSRF check" });
    return;
  }

  try {
    const isValid = validateCsrfToken(csrfHeader);
    if (!isValid) {
      console.warn(
        `Value provided in ${csrf.name} header does not validate.`,
        req.headers.origin,
        csrfHeader,
      );
      res.status(403).json({ message: "Failed CSRF check" });
      return;
    }
    next();
  } catch (err) {
    console.warn(`CSRF check error: ${err}`);
    res.status(500).json({ message: "Something went wrong" });
    return;
  }
};