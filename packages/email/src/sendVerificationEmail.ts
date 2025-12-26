import { getResendClient } from "./resend.js";

export async function sendVerificationEmail(email: string, token: string) {
  const resend = getResendClient();
  const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: email,
    subject: "Verify your email",
    html: `
      <p>Click the link below to verify your email:</p>
      <a href="${url}">${url}</a>
      <p>This link expires in 24 hours.</p>
    `,
  });
}
