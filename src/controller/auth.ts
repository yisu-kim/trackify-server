import crypto from "node:crypto";
import { NextFunction, Request, Response } from "express";
import { config } from "../config.js";

const {
  auth: { csrf },
} = config;

export function getCSRFToken(req: Request, res: Response, next: NextFunction) {
  const csrfToken = generateCSRFToken();
  res.status(200).json({ csrfToken });
}

function generateCSRFToken(): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const csrfToken = crypto
    .createHash("sha256")
    .update(csrf.secret + salt)
    .digest("hex");

  return csrfToken;
}

export function getUser(req: Request, res: Response, next: NextFunction) {
  // TODO: User.findById
  const user = {};
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.status(200).json(req.user);
}
