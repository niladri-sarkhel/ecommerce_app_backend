import nodemailer from "nodemailer";
import fs from "fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlPath = path.join(__dirname, "email-template.html");

let html = await fs.readFile(htmlPath, "utf8");

const env = Object.freeze({
  SMTP_HOST: "smtp.gmail.com",
  SMTP_PORT: 587,
  SMTP_USER: "fastfone.shop@gmail.com",
  SMTP_PASS: "thgn qvwv odfz hvxi",
  SMTP_FROM: "FastPhone <fastfone.shop@gmail.com>",
  SMTP_TO: "niladri.sarkhel.dev@gmail.com",
});

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT),
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

async function sendEmail(to, otp) {
  html = html.replace("{{OTP}}", otp);

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: to,
    subject: "Global Marketplace - Test Email",
    html,
  });

  console.log("✅ Email sent successfully!");
}

sendEmail(env.SMTP_TO, 12345).catch(console.error);
