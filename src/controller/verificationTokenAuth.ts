import { Request, Response } from "express";

import { config } from "../config.js";
import {
  generateAccessToken,
  validateVerificationToken,
} from "../utils/auth.js";
import { findUserByEmail } from "../repository/user.js";
import {
  generateAndCreateVerificationToken,
  sendSignInLink,
  sendSignUpLink,
} from "../service/verificationToken.js";

const {
  client,
  auth: { accessToken: accessTokenConfig },
} = config;

export async function handleSignUp(req: Request, res: Response) {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        message: "Email and name are required for sign up.",
      });
    }

    const foundUser = await findUserByEmail(email);
    if (foundUser) {
      console.info("Sign up attempted with existing email");
    } else {
      const token = await generateAndCreateVerificationToken({ name, email });
      await sendSignUpLink(name, email, token);
    }

    return res.status(200).json({ message: "Sign up link sent successfully." });
  } catch (error) {
    console.error("Failed to send sign up link:", error.message);
    res.status(500).json({ message: "Failed to send sign up link." });
  }
}

export async function handleSignIn(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required for sign in.",
      });
    }

    const foundUser = await findUserByEmail(email);
    if (foundUser) {
      const token = await generateAndCreateVerificationToken({ email });
      await sendSignInLink(email, token);
    } else {
      console.info("Sign in attempted with non-existent email");
    }

    return res.status(200).json({ message: "Sign in link sent successfully" });
  } catch (error) {
    console.error("Failed to send sign in link:", error.message);
    return res.status(500).json({ message: "Failed to send sign in link." });
  }
}

export async function handleVerificationToken(req: Request, res: Response) {
  try {
    const { token: verificationToken } = req.query;

    if (!verificationToken) {
      return res.status(400).json({ message: "Invalid token" });
    }

    const user = await validateVerificationToken(verificationToken);

    if (!user) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const { token: accessToken, expiresInSeconds } = generateAccessToken<{
      userId: number;
      accountId?: number; // Account is linked after initial registration
    }>({ userId: user.id, accountId: user.accountId });

    res.cookie(accessTokenConfig.name, accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      expires: new Date(Date.now() + expiresInSeconds * 1000),
    });

    return res.redirect(client.origin);
  } catch (error) {
    console.error("Verification failed:", error);
    return res.status(500).json({ message: "Verification failed" });
  }
}
