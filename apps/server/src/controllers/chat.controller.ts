/* eslint-disable @typescript-eslint/no-explicit-any */
// Chat / RAG API: retrieve relevant chunks from vector store and answer using LLM

import { Request, RequestHandler, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Conversation, Message } from "@repo/db";
import { Document as LCDocument } from "@langchain/core/documents";
import { logCacheHit, logCacheMiss, logger } from "@repo/observability";
import { extractTextContent } from "../utils/extractTextContent.js";
import {
  getDailyUsage,
  incrementUsage,
  getCachedConversations,
  setCachedConversations,
  invalidateConversations,
} from "@repo/cache";
import { createRagClients } from "@repo/rag-core";
import { getUserPlan } from "@repo/db";
import mongoose from "mongoose";
import { generateConversationTitle } from "../utils/getConversationTitle.js";

/* -------------------------------------------------------------------------- */
/* GET /chat/conversations/:conversationId/messages                            */
/* -------------------------------------------------------------------------- */
export const getConversationMessages: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId,
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate({
        path: "retrievedChunkIds",
        select: "documentId documentName chunkIndex",
      });

    return res.status(200).json({
      messages: messages.map((m) => ({
        id: m._id.toString(),
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
        sources: (m.retrievedChunkIds ?? []).map((c: any) => ({
          documentId: c.documentId,
          documentName: c.documentName,
          chunkId: c._id.toString(),
        })),
      })),
    });
  },
);

/* -------------------------------------------------------------------------- */
/* GET /chat/conversations                                                     */
/* -------------------------------------------------------------------------- */
export const listConversations: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const plan = await getUserPlan(userId);

    const cached = await getCachedConversations(userId);
    if (cached) {
      logCacheHit("conversations", userId);
      return res.json({ conversations: cached, source: "cache" });
    }

    logCacheMiss("conversations", userId);

    const userObjectId = new mongoose.Types.ObjectId(req.user.id);

    const conversations = await Conversation.aggregate([
      { $match: { userId: userObjectId } },
      {
        $lookup: {
          from: "messages",
          let: { conversationId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$conversationId", "$$conversationId"] },
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            {
              $project: {
                _id: 0,
                role: 1,
                content: 1,
                createdAt: 1,
              },
            },
          ],
          as: "lastMessage",
        },
      },
      {
        $addFields: {
          lastMessage: { $arrayElemAt: ["$lastMessage", 0] },
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          createdAt: 1,
          updatedAt: 1,
          lastMessage: 1,
        },
      },
      { $sort: { updatedAt: -1 } },
    ]);

    const normalized = conversations.map((c) => ({
      id: c._id.toString(),
      title: c.title ?? "New conversation",
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      lastMessage: c.lastMessage ?? null,
    }));

    await setCachedConversations(userId, normalized, plan);

    return res.json({
      conversations: normalized,
      source: "mongo",
    });
  },
);

/* -------------------------------------------------------------------------- */
/* POST /chat                                                                  */
/* -------------------------------------------------------------------------- */
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

    const plan = await getUserPlan(userId);
    const { vectorStore, chatModel, policy } = createRagClients(plan);

    const usageSoFar = await getDailyUsage(userId);
    if (usageSoFar.totalTokens >= policy.chat.dailyTokens) {
      return res.status(429).json({ error: "Daily usage limit exceeded" });
    }

    let conversation;

    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        userId,
      });
    } else {
      conversation = await Conversation.create({
        userId,
        title: generateConversationTitle(message),
      });
    }

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    await Message.create({
      conversationId: conversation._id,
      role: "user",
      content: message,
    });

    const filter: Record<string, any> = { userId };
    if (Array.isArray(documentIds) && documentIds.length > 0) {
      filter.documentId = { $in: documentIds };
    }

    const results = await vectorStore.similaritySearch(message, 4, filter);

    const contextDocs = results.map(
      (doc) =>
        new LCDocument({
          pageContent: doc.pageContent,
          metadata: doc.metadata,
        }),
    );

    const prompt = `You are an AI assistant answering questions strictly based on the provided context.

Context:
${contextDocs.map((d) => d.pageContent).join("\n\n")}

Question:
${message}

If the answer is not present in the context, say you don't know.`;

    const response = await chatModel.invoke(prompt);

    if (response.usage_metadata) {
      await incrementUsage(userId, {
        promptTokens: response.usage_metadata.input_tokens,
        completionTokens: response.usage_metadata.output_tokens,
        totalTokens: response.usage_metadata.total_tokens,
      });
    }

    const assistantText = extractTextContent(response.content);

    const retrievedChunkIds = results
      .map((r) => r.metadata?.vectorId)
      .filter(Boolean);

    const assistantMessage = await Message.create({
      conversationId: conversation._id,
      role: "assistant",
      content: assistantText,
      retrievedChunkIds,
    });

    await invalidateConversations(userId);

    return res.status(200).json({
      conversationId: conversation._id,
      message: assistantMessage.content,
      model: policy.chat.model,
      plan,
    });
  },
);

/* -------------------------------------------------------------------------- */
/* POST /chat/stream                                                           */
/* -------------------------------------------------------------------------- */
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

    const plan = await getUserPlan(userId);
    const { vectorStore, chatModel, policy } = createRagClients(plan);

    if (!policy.chat.streaming) {
      return res
        .status(403)
        .json({ error: "Streaming not available on your plan" });
    }

    const usageSoFar = await getDailyUsage(userId);
    if (usageSoFar.totalTokens >= policy.chat.dailyTokens) {
      return res.status(429).json({ error: "Daily usage limit exceeded" });
    }

    let conversation;

    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        userId,
      });
    } else {
      conversation = await Conversation.create({
        userId,
        title: generateConversationTitle(message),
      });
    }

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    await Message.create({
      conversationId: conversation._id,
      role: "user",
      content: message,
    });

    const filter: Record<string, any> = { userId };
    if (Array.isArray(documentIds) && documentIds.length > 0) {
      filter.documentId = { $in: documentIds };
    }

    const results = await vectorStore.similaritySearch(message, 4, filter);

    const prompt = `You are an AI assistant answering strictly from the provided context.

Context:
${results.map((r) => r.pageContent).join("\n\n")}

Question:
${message}

If the answer is not present in the context, say you don't know.`;

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

      const retrievedChunkIds = results
        .map((r) => r.metadata?.vectorId)
        .filter(Boolean);

      await Message.create({
        conversationId: conversation._id,
        role: "assistant",
        content: fullResponse,
        retrievedChunkIds,
      });

      await invalidateConversations(userId);

      await incrementUsage(userId, {
        promptTokens: Math.ceil(message.length / 4),
        completionTokens: Math.ceil(fullResponse.length / 4),
        totalTokens:
          Math.ceil(message.length / 4) + Math.ceil(fullResponse.length / 4),
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
