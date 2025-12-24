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

const QUEUE_URL = process.env.CHUNK_EMBED_QUEUE_URL!;
const POLL_INTERVAL_MS = 1000;
const VISIBILITY_TIMEOUT = 600; // 5 minutes

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
    eventSourceARN: "arn:aws:sqs:us-east-1:000000000000:document-chunk-embed",
    awsRegion: "us-east-1",
  };
}

async function pollOnce() {
  const messages = await receiveMessages(QUEUE_URL, {
    maxMessages: 5,
    waitTimeSeconds: 20,
    visibilityTimeout: 300,
  });

  if (!messages.length) return;

  logger.info(`[chunk-embed] received ${messages.length} messages`);

  await handler({
    Records: messages.map(toSqsRecord),
  });

  // delete ONLY after successful handler execution
  for (const msg of messages) {
    const extender = startVisibilityExtender(
      QUEUE_URL,
      msg.ReceiptHandle!,
      VISIBILITY_TIMEOUT,
    );

    try {
      await handler({
        Records: [toSqsRecord(msg)],
      });

      await deleteMessage(QUEUE_URL, msg.ReceiptHandle!);
    } finally {
      extender.stop();
    }
  }
}

async function start() {
  logger.info("[text-extract] local worker started");

  while (!isShuttingDown()) {
    try {
      await pollOnce();
    } catch (error) {
      logger.error("[text-extract] polling failed", {
        error,
        errorString: String(error),
      });
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  logger.info("[text-extract] polling stopped (shutdown)");
}

setupGracefulShutdown();
start();
