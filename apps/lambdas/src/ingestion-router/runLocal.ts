import "./../utils/env.js";
import { receiveMessages, deleteMessage } from "@repo/aws";
import { handler } from "./handler.js";
import { SQSEvent, SQSRecord } from "aws-lambda";

const QUEUE_URL = process.env.DOCUMENT_INGEST_QUEUE_URL!;
const POLL_INTERVAL_MS = 1000;

if (!QUEUE_URL) {
  throw new Error("DOCUMENT_INGEST_QUEUE_URL is required");
}

async function pollOnce() {
  const messages = await receiveMessages(QUEUE_URL, {
    maxMessages: 5,
    waitTimeSeconds: 10,
    visibilityTimeout: 30,
  });

  if (!messages.length) return;

  console.info(`[ingestion-router] received ${messages.length} messages`);

  const event: SQSEvent = {
    Records: messages.map(
      (m): SQSRecord => ({
        messageId: m.MessageId!,
        receiptHandle: m.ReceiptHandle!,
        body: m.Body!,
        attributes: {
          ApproximateReceiveCount: "1",
          SentTimestamp: Date.now().toString(),
          SenderId: "local",
          ApproximateFirstReceiveTimestamp: Date.now().toString(),
        },
        messageAttributes: {},
        md5OfBody: "",
        eventSource: "aws:sqs",
        eventSourceARN: "",
        awsRegion: "us-east-1",
      }),
    ),
  };

  await handler(event);

  // Delete only AFTER handler succeeds
  for (const msg of messages) {
    await deleteMessage(QUEUE_URL, msg.ReceiptHandle!);
  }
}

async function start() {
  console.info("[ingestion-router] local worker started");

  while (true) {
    try {
      await pollOnce();
    } catch (err) {
      console.error("[ingestion-router] polling failed", { err });
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

start();
