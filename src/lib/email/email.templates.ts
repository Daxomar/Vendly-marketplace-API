// Plain, mobile-friendly email templates. Keep them simple: many email
// apps strip modern CSS.
const layout = (title: string, body: string) => `
<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1f2937;">
  <h2 style="color: #03563E; margin: 0 0 16px;">${title}</h2>
  ${body}
  <p style="font-size: 12px; color: #6b7280; margin-top: 32px;">Vendly · Sell more, together</p>
</div>`;

const button = (url: string, label: string) => `
<p style="margin: 24px 0;">
  <a href="${url}" style="background: #03563E; color: #ffffff; padding: 12px 20px; border-radius: 6px; text-decoration: none; display: inline-block;">${label}</a>
</p>
<p style="font-size: 12px; color: #6b7280;">If the button doesn't work, copy this link into your browser:<br>${url}</p>`;

export const verificationEmailTemplate = ({ name, url }: { name?: string; url: string }) =>
  layout(
    "Verify your email",
    `<p>Hi ${name || "there"},</p>
     <p>Thanks for joining Vendly. Confirm your email to start selling.</p>
     ${button(url, "Verify email")}`
  );

export const resetPasswordEmailTemplate = ({ name, url }: { name?: string; url: string }) =>
  layout(
    "Reset your password",
    `<p>Hi ${name || "there"},</p>
     <p>We received a request to reset your password. If this wasn't you, you can ignore this email.</p>
     ${button(url, "Reset password")}`
  );
