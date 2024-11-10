import { config } from "../config.js";
import { generateVerificationToken } from "../utils/auth.js";
import { createVerificationToken } from "../repository/verificationToken.js";
import { transporter } from "./mail.js";

const {
  appName,
  origin,
  auth: { verificationToken: verificationTokenConfig },
} = config;

export async function generateAndCreateVerificationToken({
  name,
  email,
}: {
  name?: string;
  email: string;
}) {
  const { token, expiresInSeconds } = await generateVerificationToken({
    name,
    email,
  });

  await createVerificationToken({
    token,
    expires: new Date(Date.now() + expiresInSeconds * 1000),
    identifier: email,
  });

  return token;
}

export async function sendSignUpLink(
  name: string,
  email: string,
  token: string,
): Promise<void> {
  const link = `${origin}/auth/verify?token=${token}`;
  const expirationMinutes = Math.floor(
    verificationTokenConfig.expiresInSeconds / 60,
  );

  await transporter.sendMail({
    to: email,
    from: verificationTokenConfig.sender,
    subject: "Complete your registration",
    html: `
        <h3>Welcome ${name}!</h3>
        <p>Click the link below to complete your registration:</p>
        <p><a href="${link}">Create your account</a></p>
        <p>This link will expire in ${expirationMinutes} minutes.</p>
      `,
  });
}

export async function sendSignInLink(
  email: string,
  token: string,
): Promise<void> {
  const link = `${origin}/auth/verify?token=${token}`;
  const expirationMinutes = Math.floor(
    verificationTokenConfig.expiresInSeconds / 60,
  );

  await transporter.sendMail({
    to: email,
    from: verificationTokenConfig.sender,
    subject: `Sign in to ${appName}`,
    html: `
        <h3>Welcome back!</h3>
        <p>Click the link below to sign in:</p>
        <p><a href="${link}">Sign in to Your App</a></p>
        <p>This link will expire in ${expirationMinutes} minutes.</p>
      `,
  });
}
