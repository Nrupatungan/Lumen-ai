import mongoose, { Schema, Document, Model } from "mongoose";
import { Message } from "./message.model.js";

export interface IConversation extends Document {
  userId: mongoose.Types.ObjectId;
  title?: string;

  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    title: { type: String, index: true },
  },
  { timestamps: true },
);

ConversationSchema.pre("findOneAndDelete", async function () {
  const filter = this.getFilter();

  const conversation = await mongoose
    .model("Conversation")
    .findOne(filter)
    .select("_id");

  if (!conversation) return;

  await Message.deleteMany({ conversationId: conversation._id });
});

export const Conversation: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);
