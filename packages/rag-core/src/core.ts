import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { PLAN_POLICY } from "@repo/policy";
import { pineconeClient } from "./client.js";

/**
 * Create plan-aware LangChain clients
 */
export function createRagClients(plan: keyof typeof PLAN_POLICY) {
  const policy = PLAN_POLICY[plan];
  const pineconeIndex = pineconeClient.index(policy.embeddings.index!);

  const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY!,
    model: policy.embeddings.model,
  });

  const vectorStore = new PineconeStore(embeddings, {
    pineconeIndex,
  });

  const chatModel = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    modelName: policy.chat.model,
    temperature: 0.2,
  });

  return { vectorStore, chatModel, policy };
}
