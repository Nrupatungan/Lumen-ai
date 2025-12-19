import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubscription extends Document {
    userId: mongoose.Types.ObjectId;
    plan: "Free" | "Go" | "Pro";
    status: "active" | "expired" | "cancelled";
    startDate: Date;
    endDate?: Date;
}


const SubscriptionSchema = new Schema<ISubscription>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", unique: true },
        plan: { type: String, default: "Free" },
        status: { type: String, default: "active" },
        startDate: { type: Date, default: Date.now },
        endDate: Date,
    },
    { timestamps: true }
);


export const Subscription: Model<ISubscription> = mongoose.model<ISubscription>("Subscription", SubscriptionSchema);