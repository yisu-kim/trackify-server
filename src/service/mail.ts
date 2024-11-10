import nodemailer from "nodemailer";
import { config } from "../config.js";

const { smtp } = config;

// TODO: Change SMTP provider
export const transporter = nodemailer.createTransport({
  host: smtp.host,
  port: 587,
  secure: false,
  auth: {
    user: smtp.user,
    pass: smtp.password,
  },
});
