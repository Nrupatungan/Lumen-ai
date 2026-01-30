/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User, Account, VerificationToken, PasswordResetToken } from "@repo/db";
import {
  getCachedUserProfile,
  setCachedUserProfile,
  invalidateAllUserCaches,
  invalidateUserProfile,
} from "@repo/cache";
import { logger, logCacheHit, logCacheMiss } from "@repo/observability";
import {
  createEmailVerification,
  createPasswordReset,
} from "../services/auth.service.js";
import {
  loginSchema,
  oauthLoginSchema,
  registerSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "../libs/validators/auth.validator.js";
import Busboy from "busboy";
import { PassThrough } from "node:stream";
import { deleteObject, getObjectUrl, uploadStreamToS3 } from "@repo/aws";
import crypto from "node:crypto";
import mongoose from "mongoose";

/**
 * GET /users/me
 * Return current authenticated user's profile
 */
export const getMe: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.id) {
      logger.warn("Unauthorized user!");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;

    // ---------- CACHE CHECK ----------
    const cached = await getCachedUserProfile(userId);
    if (cached) {
      logCacheHit("profile", userId);
      return res.status(200).json({
        userProfile: cached,
        source: "cache",
      });
    }

    logCacheMiss("profile", userId);

    // ---------- DB QUERY ----------
    const result = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "userId",
          as: "subscription",
        },
      },
      {
        $unwind: {
          path: "$subscription",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          plan: { $ifNull: ["$subscription.plan", "Free"] },
        },
      },
      { $project: { password: 0 } },
    ]);

    if (!result || result.length === 0) {
      logger.warn("User not found!");
      return res.status(404).json({ error: "User not found" });
    }

    const user = result[0];

    let imageURL: string | null = null;

    if (typeof user.image === "string") {
      if (user.image.startsWith("users/profile")) {
        imageURL = await getObjectUrl(process.env.S3_BUCKET_NAME!, user.image);
      } else {
        imageURL = user.image;
      }
    }

    const response = {
      id: user._id,
      email: user.email,
      name: user.name,
      image: imageURL,
      role: user.role,
      plan: user.plan,
      createdAt: user.createdAt,
    };

    // ---------- CACHE SET ----------
    await setCachedUserProfile(userId, response, user.plan);

    logger.info(`Fetched profile details for user ${userId}`);
    return res.status(200).json({ userProfile: response, source: "mongo" });
  },
);

/**
 * PATCH /users/me
 * Update profile fields (name, avatar)
 */
export const updateMe: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.id) {
      logger.warn("Unauthorized user!");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const busboy = Busboy({ headers: req.headers });

    const fields: Record<string, any> = {};

    let newImageKey: string | null = null;
    let uploadPromise: Promise<unknown> | null = null;

    busboy.on("field", (name, value) => {
      fields[name] = value;
    });

    busboy.on("file", (name, file, info) => {
      if (name !== "image") {
        file.resume();
        return;
      }

      const { filename, mimeType } = info;

      if (!mimeType.startsWith("image/")) {
        file.resume();
        throw new Error("Invalid image type");
      }

      const pass = new PassThrough();
      const key = `users/profile/${crypto.randomUUID()}-${filename}`;

      newImageKey = key;

      uploadPromise = uploadStreamToS3(
        process.env.S3_BUCKET_NAME!,
        key,
        pass,
        mimeType,
      );

      file.pipe(pass);
    });

    busboy.on("finish", async () => {
      try {
        const update: Record<string, any> = {};

        if (typeof fields.name === "string") {
          update.name = fields.name;
        }

        // Load user to get old image
        const user = await User.findById(req.user!.id);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        // Wait for image upload (if any)
        if (uploadPromise) {
          await uploadPromise;

          const bucket = process.env.S3_BUCKET_NAME!;
          const newImageUrl = getObjectUrl(bucket, newImageKey!);

          update.image = newImageUrl;

          // Delete old avatar if exists
          if (user.image) {
            try {
              const oldKey = user.image;
              await deleteObject(bucket, oldKey);
            } catch (err) {
              logger.warn("Failed to delete old avatar", { err });
            }
          }
        }

        if (Object.keys(update).length === 0) {
          return res.status(400).json({ error: "No valid fields to update" });
        }

        Object.assign(user, update);
        await user.save();

        await invalidateUserProfile(req.user!.id);

        logger.info(`Updated profile for user ${req.user!.id}`);

        return res.status(200).json({
          id: user._id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        });
      } catch (err) {
        logger.error("Profile update failed", { err });
        return res.status(400).json({ error: "Profile update failed" });
      }
    });

    req.pipe(busboy);
  },
);

/**
 * DELETE /users/me
 * Deletes the current user
 */
export const deleteMe: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.id) {
      logger.warn("Unauthorized deleteMe access");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;

    // Soft-delete pattern is better, but hard delete for now
    await User.findByIdAndDelete(userId);

    await invalidateAllUserCaches(userId);

    logger.info(`Deleted user and associated data: ${userId}`);
    return res.status(204).send();
  },
);

/**
 * POST /users/register
 */
export const register: RequestHandler = asyncHandler(async (req, res) => {
  const busboy = Busboy({ headers: req.headers });
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
      mimeType,
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
      res.status(401).json({ message: "Invalid registration data" });
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
  res.status(200).json({
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
  res.status(200).json({
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
    return res.status(400).json({ error: "Token required" });
  }

  const record = await VerificationToken.findOne({ token });
  if (!record || record.expires < new Date()) {
    logger.warn("Token invalid or expired. Email verification failed!");
    return res.status(400).json({ error: "Invalid or expired token." });
  }

  await User.findOneAndUpdate(
    { email: record.identifier },
    { emailVerified: new Date() },
  );

  await VerificationToken.deleteOne({ _id: record._id });

  logger.info("Email verified successfully");
  res.status(200).json({ message: "Email verified successfully" });
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
    res.status(200).json({
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
  res.status(200).json({ message: "Password reset successful" });
});
