import mongoose, { Schema, Document, Model, QueryFilter } from "mongoose";
import bcrypt from "bcrypt";
import { Subscription } from "./subscription.model.js";
import { Payment } from "./payment.model.js";
import { DocumentModel } from "./document.model.js";
import { Account } from "./account.model.js";
import { Conversation } from "./conversation.model.js";
import { IngestionJob } from "./ingestion-job.model.js";
import { UsageRecord } from "./usageRecord.model.js";
import { VerificationToken } from "./verificationToken.model.js";
import { PasswordResetToken } from "./passwordRestToken.model.js";

export interface IUser extends Document {
  name?: string;
  email?: string;
  password?: string;
  role: "admin" | "user";
  emailVerified?: Date | null;
  image?: string;

  createdAt: Date;
  updatedAt: Date;

  // eslint-disable-next-line no-unused-vars
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String },
    email: { type: String, unique: true, sparse: true },
    password: { type: String, select: false },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    emailVerified: { type: Date },
    image: { type: String },
  },
  { timestamps: true },
);

/* 🔐 Password Hashing */
UserSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;

  const salt = await bcrypt.genSalt(Number(process.env.SALT_ROUNDS) || 10);

  this.password = await bcrypt.hash(this.password, salt);
});

/* 🔐 Compare Password */
UserSchema.methods.comparePassword = function (password: string) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(password, this.password);
};

UserSchema.pre("findOneAndDelete", async function () {
  const filter = this.getFilter() as QueryFilter<IUser>;
  const user = await mongoose
    .model<IUser>("User")
    .findOne(filter)
    .select("_id");

  if (!user) return;

  const userId = user._id;

  const [conversations, documents] = await Promise.all([
    Conversation.find({ userId }).select("_id"),
    DocumentModel.find({ userId }).select("_id"),
  ]);

  await Promise.allSettled([
    // TODO: Protect against massive fan-out
    //     for (const c of conversations) {
    //   await Conversation.findByIdAndDelete(c._id);
    // }
    // Or push IDs to a background worker.

    ...conversations.map((c) => Conversation.findByIdAndDelete(c._id)),
    ...documents.map((d) => DocumentModel.findByIdAndDelete(d._id)),
    Subscription.deleteOne({ userId }),
    Payment.deleteMany({ userId }),
    Account.deleteMany({ userId }),
    IngestionJob.deleteMany({ userId }),
    UsageRecord.deleteOne({ userId }),
    PasswordResetToken.deleteOne({ userId }),
    VerificationToken.deleteOne({ userId }),
  ]);
});

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
