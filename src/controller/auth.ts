import { Request, Response } from "express";

import { generateCsrfToken } from "../utils/auth.js";

export interface User {
  accountId: number;
  providerAccountId: string;
  accessToken: string;
}

export function getCsrfToken(req: Request, res: Response) {
  const csrfToken = generateCsrfToken();
  return res.status(200).set("Cache-Control", "no-store").json({ csrfToken });
}

export async function getUser(req: Request, res: Response) {
  if (!req.currentUser) {
    return res.status(401).json({ message: "User not found." });
  }

  const { id } = req.currentUser;

  return res.status(200).json({ id });
}
