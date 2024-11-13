import { NextFunction, Request, Response } from "express";

import { findAccountById } from "../repository/account.js";

export async function enrichWithAccount(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { accountId } = req.currentUser;

  const accountWithoutAccessToken = await findAccountById(accountId, {
    attributes: { exclude: ["access_token"] },
  });
  if (!accountWithoutAccessToken) {
    console.warn("Account not found.");
    return res.status(404).json({ message: "Account not found." });
  }

  req.currentUser = { ...req.currentUser, account: accountWithoutAccessToken };

  next();
}
