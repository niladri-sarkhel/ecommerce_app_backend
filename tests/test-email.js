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
  SMTP_FROM: "FastPhone <fastphone@gmail.com>",
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

async function sendEmail() {
  html = html.replace("{{OTP}}", "123456");

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: env.SMTP_USER,
    subject: "Global Marketplace - Test Email",
    html,
  });

  console.log("✅ Email sent successfully!");
}

sendEmail().catch(console.error);
