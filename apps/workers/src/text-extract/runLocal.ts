import {
  deleteMessage,
  receiveMessages,
  startVisibilityExtender,
} from "@repo/aws";
import { handler } from "./handler.js";
import { logger } from "@repo/observability";
import { SQSRecord } from "aws-lambda";
import { isShuttingDown, setupGracefulShutdown } from "../utils/shutdown.js";

const QUEUE_URL = process.env.TEXT_EXTRACT_QUEUE_URL!;
const POLL_INTERVAL_MS = 1000;
const VISIBILITY_TIMEOUT = 600;

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
    eventSourceARN: "arn:aws:sqs:us-east-1:000000000000:document-text-extract",
    awsRegion: "us-east-1",
  };
}

async function pollOnce() {
  const res = await receiveMessages(QUEUE_URL);

  if (!res || res.length === 0) {
    return;
  }

  logger.info(`[text-extract] received ${res.length} messages`);

  await handler({
    Records: res.map(toSqsRecord),
  });

  // delete messages ONLY after handler succeeds
  for (const msg of res) {
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
