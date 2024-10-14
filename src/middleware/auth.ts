import { NextFunction, Request, Response } from "express";
import { config } from "../config.js";
import { decryptData } from "../utils/crypto.js";

const {
  auth: { token },
} = config;

export function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authToken = req.cookies[token.name];

  if (!authToken) {
    return res.status(401).json({ message: "No authentication token found" });
  }

  try {
    const { id, encrypted } = JSON.parse(authToken);
    const decrypted = decryptData(id, encrypted);
    if (!decrypted) {
      return res.status(401).json({ message: "Failed to decrypt token." });
    }

    req.user = { id, token: decrypted };
    next();
  } catch (err) {
    console.error(`Authentication error: ${err}`);
    return res
      .status(401)
      .json({ message: "Invalid token or decryption process failed." });
  }
}
