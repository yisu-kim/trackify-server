import { Request, Response } from "express";

import { config } from "../config.js";
import { validateVerificationToken } from "../utils/auth.js";
import { findUserByEmail } from "../repository/user.js";
import {
  generateAndCreateVerificationToken,
  sendSignInLink,
  sendSignUpLink,
} from "../service/verificationToken.js";

const { client } = config;

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
      const token = await generateAndCreateVerificationToken({ name, email });
      await sendSignUpLink(name, email, token);
    } else {
      console.info("Sign up attempted with existing email");
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
    res.status(500).json({ message: "Failed to send sign in link." });
  }
}

export async function handleVerificationToken(req: Request, res: Response) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Invalid token" });
    }

    const user = await validateVerificationToken(token);

    if (!user) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    res.redirect(client.origin);
  } catch (error) {
    console.error("Verification failed:", error);
    res.status(500).json({ message: "Verification failed" });
  }
}
