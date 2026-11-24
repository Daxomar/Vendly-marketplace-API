// Sends emails through SendGrid. If SendGrid isn't configured (normal in
// local development), the email is printed to the terminal instead, so you
// can still click verification and reset links.
import sgMail from "@sendgrid/mail";
import { env, features } from "../../config/env.js";
import { logger } from "../logger.js";
import { verificationEmailTemplate, resetPasswordEmailTemplate } from "./email.templates.js";

if (features.email) sgMail.setApiKey(env.SENDGRID_API_KEY);

async function send({ to, subject, html, link }: { to: string; subject: string; html: string; link?: string }) {
  if (!features.email) {
    logger.info(`📧 [email not configured] "${subject}" → ${to}`, link ? { link } : undefined);
    return;
  }
  await sgMail.send({ to, from: env.EMAIL_FROM, subject, html });
  logger.info(`📧 Sent "${subject}" → ${to}`);
}

export async function sendVerificationEmail({ to, name, url }: { to: string; name?: string; url: string }) {
  await send({ to, subject: "Verify your Vendly account", html: verificationEmailTemplate({ name, url }), link: url });
}

export async function sendResetPasswordEmail({ to, name, url }: { to: string; name?: string; url: string }) {
  await send({ to, subject: "Reset your Vendly password", html: resetPasswordEmailTemplate({ name, url }), link: url });
}
