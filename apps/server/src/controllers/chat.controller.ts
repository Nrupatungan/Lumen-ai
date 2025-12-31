/* eslint-disable @typescript-eslint/no-explicit-any */
// Chat / RAG API: retrieve relevant chunks from Pinecone via LangChain and answer using LLM

import { Request, RequestHandler, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Conversation, Message } from "@repo/db";
import { Document as LCDocument } from "@langchain/core/documents";
import { logger } from "@repo/observability";
import { extractTextContent } from "../utils/extractTextContent.js";
import { getDailyUsage, incrementUsage } from "@repo/cache";
import { getUserPlan } from "@repo/policy";
import { createRagClients } from "@repo/rag-core";

/**
 * POST /chat
 */
export const chatWithDocuments: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized user" });
    }

    const userId = req.user.id;
    const { conversationId, documentIds, message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    // 1. Resolve plan & policy
    const plan = await getUserPlan(userId);
    const { vectorStore, chatModel, policy } = createRagClients(plan);

    // 2. Enforce usage limits (soft)
    const usageSoFar = await getDailyUsage(userId);

    if (usageSoFar.totalTokens >= policy.chat.dailyTokens) {
      return res.status(429).json({ error: "Daily usage limit exceeded" });
    }

    // 3. Resolve or create conversation
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        userId,
      });
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
    } else {
      conversation = await Conversation.create({ userId });
    }

    // Persist user message
    await Message.create({
      conversationId: conversation._id,
      role: "user",
      content: message,
    });

    // 4. Build Pinecone filter
    const filter: Record<string, any> = { userId };
    if (Array.isArray(documentIds) && documentIds.length > 0) {
      filter.documentId = { $in: documentIds };
    }

    // 5. Retrieve relevant chunks
    const results = await vectorStore.similaritySearch(message, 4, filter);

    const contextDocs: LCDocument[] = results.map(
      (doc) =>
        new LCDocument({
          pageContent: doc.pageContent,
          metadata: doc.metadata,
        }),
    );

    const contextText = contextDocs
      .map((d, i) => `Source ${i + 1}:\n${d.pageContent}`)
      .join("\n\n");

    const prompt = `You are an AI assistant answering questions strictly based on the provided context.

Context:
${contextText}

Question:
${message}

If the answer is not present in the context, say you don't know.`;

    // 6. Call LLM
    const response = await chatModel.invoke(prompt);

    // Usage tracking (best-effort)
    if (response.usage_metadata) {
      await incrementUsage(userId, {
        promptTokens: response.usage_metadata.input_tokens,
        completionTokens: response.usage_metadata.output_tokens,
        totalTokens: response.usage_metadata.total_tokens,
      });
    }

    const assistantText = extractTextContent(response.content);

    // Persist assistant message
    const assistantMessage = await Message.create({
      conversationId: conversation._id,
      role: "assistant",
      content: assistantText,
      retrievedChunkIds: contextDocs
        .map((d) => d.metadata?.vectorId)
        .filter(Boolean),
    });

    return res.json({
      conversationId: conversation._id,
      message: assistantMessage.content,
      model: policy.chat.model,
      plan,
    });
  },
);

/**
 * POST /chat/stream
 */
export const streamChat: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const { conversationId, documentIds, message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    // 1. Resolve plan & policy
    const plan = await getUserPlan(userId);
    const { vectorStore, chatModel, policy } = createRagClients(plan);

    // Streaming is plan-gated
    if (!policy.chat.streaming) {
      return res
        .status(403)
        .json({ error: "Streaming not available on your plan" });
    }

    // Usage limit check (soft)
    const usageSoFar = await getDailyUsage(userId);
    if (usageSoFar.totalTokens >= policy.chat.dailyTokens) {
      return res.status(429).json({ error: "Daily usage limit exceeded" });
    }

    // 2. Resolve or create conversation
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        userId,
      });
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
    } else {
      conversation = await Conversation.create({ userId });
    }

    // Persist user message
    await Message.create({
      conversationId: conversation._id,
      role: "user",
      content: message,
    });

    // 3. Retrieve context
    const filter: Record<string, any> = { userId };
    if (Array.isArray(documentIds) && documentIds.length > 0) {
      filter.documentId = { $in: documentIds };
    }

    const results = await vectorStore.similaritySearch(message, 4, filter);

    const contextText = results
      .map((r, i) => `Source ${i + 1}:\n${r.pageContent}`)
      .join("\n\n");

    const prompt = `You are an AI assistant answering strictly from the provided context.

Context:
${contextText}

Question:
${message}

If the answer is not present in the context, say you don't know.`;

    // 4. SSE setup
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let fullResponse = "";

    try {
      const stream = await chatModel.stream(prompt);

      for await (const chunk of stream) {
        const token = chunk.content ?? "";
        if (token) {
          fullResponse += token;
          res.write(`data: ${JSON.stringify({ token })}\n\n`);
        }
      }

      res.write("event: end\n");
      res.write("data: {}\n\n");
      res.end();

      await Message.create({
        conversationId: conversation._id,
        role: "assistant",
        content: fullResponse,
      });

      // Fallback usage estimation (streaming)
      await incrementUsage(userId, {
        totalTokens: Math.ceil(fullResponse.length / 4),
      });
    } catch (error) {
      logger.error("Streaming chat failed", { error, userId, plan });
      res.write(
        `event: error\ndata: ${JSON.stringify({ error: "Stream failed" })}\n\n`,
      );
      res.end();
    }
  },
);
