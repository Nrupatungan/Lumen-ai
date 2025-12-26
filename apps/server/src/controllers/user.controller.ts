import { Request, Response, RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  User,
  Subscription,
  DocumentModel,
  Conversation,
  Message,
  Account,
  VerificationToken,
  PasswordResetToken,
} from "@repo/db";
import { getDailyUsage } from "@repo/cache";
import { logger } from "@repo/observability";
import {
  createEmailVerification,
  createPasswordReset,
} from "../services/auth.service.js";
import {
  registerSchema,
  loginSchema,
  requestPasswordResetSchema,
} from "@repo/shared";
import {
  oauthLoginSchema,
  resetPasswordSchema,
} from "../libs/validators/auth.validator.js";
import Busboy from "busboy";
import { PassThrough } from "node:stream";
import { getObjectUrl, uploadStreamToS3 } from "@repo/aws";
import crypto from "node:crypto";

/**
 * GET /users/me
 * Return current authenticated user's profile
 */
export const getMe: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || !req.user.id) {
      logger.warn("Unauthorized user!");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findById(req.user.id).lean();
    if (!user) {
      logger.warn("User not found!");
      return res.status(404).json({ error: "User not found" });
    }
    
    const imageURL = await getObjectUrl(process.env.S3_BUCKET_NAME!, user.image!);

    logger.info(`Fetched profile details for user ${req.user.id}`);
    return res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      image: imageURL,
      role: user.role,
      createdAt: user.createdAt,
    });
  },
);

/**
 * PATCH /users/me
 * Update profile fields (name, image)
 */
export const updateMe: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || !req.user.id) {
      logger.warn("Unauthorized user!");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { name, image } = req.body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: Record<string, any> = {};
    if (typeof name === "string") update.name = name;
    if (typeof image === "string") update.image = image;

    if (Object.keys(update).length === 0) {
      logger.warn("No valid fields to update");
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const user = await User.findByIdAndUpdate(req.user.id, update, {
      new: true,
    }).lean();

    if (!user) {
      logger.warn("User not found!");
      return res.status(404).json({ error: "User not found" });
    }

    logger.info(`Updated profile for user ${req.user.id}`);
    return res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
    });
  },
);

/**
 * GET /users/me/usage
 * Lightweight usage summary for today
 */
export const getMyUsage: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || !req.user.id) {
      logger.warn("Unauthorized user!");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const usage = await getDailyUsage(req.user.id);
    
    logger.info(`Fetched Usage summary for user: ${req.user.id}`);
    return res.json(usage);
  },
);

export const getMySubscription: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user || !req.user.id) {
      logger.warn("Unauthorized subscription access");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;

    const subscription = await Subscription.findOne({
      userId,
    }).lean();

    if (!subscription) {
      return res.json({
        plan: "Free",
        status: "active",
      });
    }

    logger.info(`Fetched subscription for user: ${userId}`);
    return res.json({
      plan: subscription.plan,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
    });
  },
);

export const deleteMe: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.id) {
      logger.warn("Unauthorized deleteMe access");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;

    // Soft-delete pattern is better, but hard delete for now
    await Promise.all([
      User.findByIdAndDelete(userId),
      Subscription.deleteOne({ userId }),
      DocumentModel.deleteMany({ userId }),
      Conversation.deleteMany({ userId }),
      Message.deleteMany({ userId }),
    ]);

    logger.info(`Deleted user and associated data: ${userId}`);
    return res.status(204).send();
  },
);

/**
 * POST /users/register
 */
export const register: RequestHandler = asyncHandler(async (req, res) => {
  const busboy = Busboy({ headers: req.headers });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fields: Record<string, any> = {};
  let imageUploadPromise: Promise<void> | null = null;
  let imageKey: string | null = null;

  busboy.on("field", (name, value) => {
    fields[name] = value;
  });

  busboy.on("file", (name, file, info) => {
    if (name !== "image") {
      file.resume(); // discard unexpected files
      return;
    }

    const { filename, mimeType } = info;

    if (!mimeType.startsWith("image/")) {
      file.resume();
      throw new Error("Invalid image type");
    }

    const pass = new PassThrough();
    const key = `users/profile/${crypto.randomUUID()}-${filename}`;

    imageKey = key;
    imageUploadPromise = uploadStreamToS3(
      process.env.S3_BUCKET_NAME!,
      key,
      pass,
      mimeType
    );

    file.pipe(pass);
  });

  busboy.on("finish", async () => {
    try {
      // Validate fields
      const parsed = registerSchema.parse(fields);

      const existing = await User.findOne({ email: parsed.email });
      if (existing) {
        logger.warn("Email already in use");
        return res.status(409).json({ message: "Email already in use" });
      }

      // Wait for image upload (if present)
      if (imageUploadPromise) {
        await imageUploadPromise;
      }

      const user = await User.create({
        email: parsed.email,
        password: parsed.password,
        name: parsed.name,
        image: imageKey!, // store S3 key
        role: "user",
        emailVerified: null,
      });

      await createEmailVerification(user.email!);

      logger.info("User created. Waiting for email verification");
      res.status(201).json({
        message: "User created. Check your email for verification.",
      });
    } catch (err) {
      logger.error("Registration failed", { err });
      res.status(400).json({ message: "Invalid registration data" });
    }
  });

  req.pipe(busboy);
});

/**
 * POST /users/login
 * Used by Auth.js Credentials Provider
 */
export const login: RequestHandler = asyncHandler(async (req, res) => {
  const parsed = loginSchema.parse(req.body);

  const user = await User.findOne({ email: parsed.email }).select("+password");

  if (!user) {
    logger.warn("Invalid credentials");
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (!user.emailVerified) {
    await createEmailVerification(user.email!);

    logger.warn("Email not verified. Verification email sent.");
    return res.status(403).json({
      message: "Email not verified. Verification email sent.",
    });
  }

  const ok = await user.comparePassword(parsed.password);
  if (!ok) {
    logger.error("password comparison failed.");
    return res.status(401).json({ message: "Invalid credentials" });
  }

  logger.info("Login successful.");
  res.json({
    user: {
      id: user._id.toString(),
      role: user.role,
    },
  });
});

/**
 * POST /users/oauth-login
 * Used by Auth.js OAuth providers
 */
export const oauthLogin: RequestHandler = asyncHandler(async (req, res) => {
  const parsed = oauthLoginSchema.parse(req.body);
  const { provider, providerAccountId, email, name, image } = parsed;

  let account = await Account.findOne({ provider, providerAccountId });
  let user;

  if (account) {
    user = await User.findById(account.userId);
  } else {
    user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        name,
        image,
        role: "user",
        emailVerified: new Date(), // OAuth trusted
      });
    }

    account = await Account.create({
      userId: user._id,
      provider,
      providerAccountId,
    });
  }

  logger.info("OAuth login successful.");
  res.json({
    user: {
      id: user!._id.toString(),
      role: user!.role,
    },
  });
});

/**
 * POST /users/verify-email
 */
export const verifyEmail: RequestHandler = asyncHandler(async (req, res) => {
  const token = req.body.token ?? req.query.token;
  if (!token) {
    logger.warn("Token missing. Email verification failed.");
    return res.status(400).json({ message: "Token required" });
  }

  const record = await VerificationToken.findOne({ token });
  if (!record || record.expires < new Date()) {
    logger.warn("Token invalid or expired. Email verification failed!");
    return res.status(400).json({ message: "Invalid or expired token." });
  }

  await User.findOneAndUpdate(
    { email: record.identifier },
    { emailVerified: new Date() },
  );

  await VerificationToken.deleteOne({ _id: record._id });

  logger.info("Email verified successfully");
  res.json({ message: "Email verified successfully" });
});

/**
 * POST /users/request-password-reset
 */
export const requestPasswordReset: RequestHandler = asyncHandler(
  async (req, res) => {
    const parsed = requestPasswordResetSchema.parse(req.body);

    const user = await User.findOne({ email: parsed.email });
    if (user) {
      await createPasswordReset(user._id.toString(), user.email!);
    }

    // Never leak existence
    res.json({
      message: "If an account exists, a reset link will be sent.",
    });
  },
);

/**
 * POST /users/reset-password
 */
export const resetPassword: RequestHandler = asyncHandler(async (req, res) => {
  const parsed = resetPasswordSchema.parse(req.body);

  const record = await PasswordResetToken.findOne({ token: parsed.token });
  if (!record || record.expires < new Date()) {
    logger.error("Invalid or expired token. Password reset failed.");
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  const user = await User.findById(record.userId);
  if (!user) {
    logger.warn("User not found.");
    return res.status(404).json({ message: "User not found" });
  }

  user.password = parsed.password;
  await user.save(); // triggers pre-save hashing

  await PasswordResetToken.deleteOne({ _id: record._id });

  logger.info("Password reset successful.");
  res.json({ message: "Password reset successful" });
});
