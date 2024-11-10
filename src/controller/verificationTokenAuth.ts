import { Request, Response } from "express";

import { config } from "../config.js";
import {
  generateVerificationToken,
  validateVerificationToken,
} from "../utils/auth.js";
import { findUserByEmail } from "../repository/user.js";
import { createVerificationToken } from "../repository/verificationToken.js";
import {
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

    const { token, expiresInSeconds } = await generateVerificationToken({
      name,
      email,
    });

    await createVerificationToken({
      token,
      expires: new Date(Date.now() + expiresInSeconds * 1000),
      identifier: email,
    });

    await sendSignUpLink(email, name, token);
    res.status(200).json({ message: "Sign up link sent successfully." });
  } catch (error) {
    console.error("Failed to send sign up link:", error);
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
    if (!foundUser) {
      throw new Error("User not found");
    }

    const {
      token: verificationToken,
      expiresInSeconds: expiresInMilliseconds,
    } = await generateVerificationToken({ email });

    await createVerificationToken({
      token: verificationToken,
      expires: new Date(Date.now() + expiresInMilliseconds),
      identifier: email,
    });

    await sendSignInLink(email, verificationToken);
    res.status(200).json({ message: "Registration link sent successfully" });
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({ message: error.message });
    }

    console.error("Failed to send sign in link:", error);
    res.status(500).json({ message: "Failed to send sign in link" });
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
