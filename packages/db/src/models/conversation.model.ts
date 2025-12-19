import mongoose, { Schema, Document, Model } from "mongoose";

export interface IConversation extends Document {
    userId: mongoose.Types.ObjectId;
    title?: string;
}


const ConversationSchema = new Schema<IConversation>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
        title: String,
    },
    { timestamps: true }
);


export const Conversation: Model<IConversation> = mongoose.model<IConversation>("Conversation", ConversationSchema);