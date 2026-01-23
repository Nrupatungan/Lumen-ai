import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";

export const pineconeClient = new PineconeClient({
  apiKey: String(process.env.PINECONE_API_KEY),
});
