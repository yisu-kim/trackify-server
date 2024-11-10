import nodemailer from "nodemailer";

// INFO: This is a sample account provided by Nodemailer for testing purposes only.
// TODO: Change SMTP provider
export const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false,
  auth: {
    user: "maddison53@ethereal.email",
    pass: "jn7jnAPss4f63QBp6D",
  },
});
