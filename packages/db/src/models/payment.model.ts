import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  orderId: string;
  paymentId?: string;
  amount: number;
  currency: string;
  status: "created" | "success" | "failed";

  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    orderId: { type: String, required: true, unique: true },
    paymentId: String,
    amount: Number,
    currency: { type: String, default: "INR" },
    status: { type: String, default: "created" },
  },
  { timestamps: true },
);

export const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);
