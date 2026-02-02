import crypto from "node:crypto";
import { VerificationToken, PasswordResetToken } from "@repo/db";

import { sendPasswordResetEmail, sendVerificationEmail } from "@repo/email";

export async function createEmailVerification(email: string) {
  // prevent token spam
  await VerificationToken.deleteMany({ identifier: email });

  const token = crypto.randomBytes(32).toString("hex");

  await VerificationToken.create({
    identifier: email,
    token,
    expires: new Date(Date.now() + Number(process.env.EMAIL_VERIFY_TTL)),
  });

  await sendVerificationEmail(email, token);
  console.log("FRONTEND_URL =", process.env.FRONTEND_URL)
}

export async function createPasswordReset(userId: string, email: string) {
  await PasswordResetToken.deleteMany({ userId });

  const token = crypto.randomBytes(32).toString("hex");

  await PasswordResetToken.create({
    userId,
    token,
    expires: new Date(Date.now() + Number(process.env.PASSWORD_RESET_TTL)),
  });

  await sendPasswordResetEmail(email, token);
  console.log("FRONTEND_URL =", process.env.FRONTEND_URL)
}
