import { Request, Response } from "express";
import { generateCsrfToken } from "../utils/crypto.js";

export function getCsrfToken(req: Request, res: Response) {
  const csrfToken = generateCsrfToken();
  res.status(200).json({ csrfToken });
  return;
}

export function getUser(req: Request, res: Response) {
  // TODO: User.findById
  const user = {};
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.status(200).json(req.user);
  return;
}
