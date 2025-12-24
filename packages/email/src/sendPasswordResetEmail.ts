import { getResendClient } from "./resend.js";

export async function sendPasswordResetEmail(email: string, token: string) {
  const resend = getResendClient();
  const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: "Your App <no-reply@yourdomain.com>",
    to: email,
    subject: "Reset your password",
    html: `
      <p>Click the link below to reset your password:</p>
      <a href="${url}">${url}</a>
      <p>This link expires in 1 hour.</p>
    `,
  });
}
