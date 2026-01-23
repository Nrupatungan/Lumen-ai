import "dotenv/config";

import {
  receiveMessages,
  deleteMessage,
  startVisibilityExtender,
} from "@repo/aws";
import { handler } from "./handler.js";
import { logger } from "@repo/observability";
import { SQSRecord } from "aws-lambda";
import { isShuttingDown, setupGracefulShutdown } from "../utils/shutdown.js";

const QUEUE_URL = String(process.env.CHUNK_EMBED_QUEUE_URL);
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS);
const VISIBILITY_TIMEOUT = Number(process.env.VISIBILITY_TIMEOUT);
const AWS_REGION = String(process.env.AWS_REGION);

/**
 * Convert SQS SDK message → Lambda SQSRecord
 * (required to keep handler 100% Lambda-compatible)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSqsRecord(message: any): SQSRecord {
  const now = Date.now().toString();

  return {
    messageId: message.MessageId!,
    receiptHandle: message.ReceiptHandle!,
    body: message.Body!,
    attributes: {
      ApproximateReceiveCount: "1",
      SentTimestamp: now,
      SenderId: "localstack",
      ApproximateFirstReceiveTimestamp: now,
    },
    messageAttributes: {},
    md5OfBody: "",
    eventSource: "aws:sqs",
    eventSourceARN: String(process.env.CHUNK_EMBED_QUEUE_ARN),
    awsRegion: AWS_REGION,
  };
}

async function pollOnce() {
  const messages = await receiveMessages(QUEUE_URL, {
    maxMessages: 5,
    waitTimeSeconds: 20,
    visibilityTimeout: VISIBILITY_TIMEOUT,
  });

  if (!messages.length) return;

  logger.info(`[worker] received ${messages.length} messages`);

  // 🔐 Extend visibility for entire batch
  const extenders = messages.map((msg) =>
    startVisibilityExtender(QUEUE_URL, msg.ReceiptHandle!, VISIBILITY_TIMEOUT),
  );

  try {
    // ✅ SINGLE handler execution
    await handler({
      Records: messages.map(toSqsRecord),
    });

    // ✅ Delete after successful processing
    for (const msg of messages) {
      await deleteMessage(QUEUE_URL, msg.ReceiptHandle!);
    }
  } finally {
    // 🔕 Stop all extenders
    for (const e of extenders) e.stop();
  }
}

async function start() {
  logger.info("[chunk-embed] local worker started");

  while (!isShuttingDown()) {
    try {
      await pollOnce();
    } catch (error) {
      logger.error("[chunk-embed] polling failed", {
        error,
        errorString: String(error),
      });
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  logger.info("[chunk-embed] polling stopped (shutdown)");
}

setupGracefulShutdown();
start();
