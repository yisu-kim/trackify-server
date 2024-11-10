import { config } from "../config.js";
import { transporter } from "./mail.js";

const {
  origin,
  auth: { verificationToken: verificationTokenConfig },
} = config;

export async function sendSignUpLink(
  email: string,
  name: string,
  token: string,
): Promise<void> {
  const link = `${origin}/auth/verify?token=${token}`;
  await transporter.sendMail({
    to: email,
    from: verificationTokenConfig.sender,
    subject: "Complete your registration",
    html: `
        <h3>Welcome ${name}!</h3>
        <p>Click the link below to complete your registration:</p>
        <p><a href="${link}">Create your account</a></p>
        <p>This link will expire in 10 minutes.</p>
      `,
  });
}

export async function sendSignInLink(
  email: string,
  token: string,
): Promise<void> {
  const link = `${origin}/auth/verify?token=${token}`;
  await transporter.sendMail({
    to: email,
    from: verificationTokenConfig.sender,
    subject: "Sign in to Your App",
    html: `
        <h3>Welcome back!</h3>
        <p>Click the link below to sign in:</p>
        <p><a href="${link}">Sign in to Your App</a></p>
        <p>This link will expire in 10 minutes.</p>
      `,
  });
}
