import {
  ChangeMessageVisibilityCommand,
  DeleteMessageCommand,
  Message,
  ReceiveMessageCommand,
  SendMessageCommand,
} from "@aws-sdk/client-sqs";
import { getSQSClient } from "./clients.js";

export async function sendMessage<T>(
  queueUrl: string,
  message: T,
): Promise<void> {
  const client = getSQSClient();

  await client.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
    }),
  );
}

export async function receiveMessages(
  queueUrl: string,
  options?: {
    maxMessages?: number;
    waitTimeSeconds?: number;
    visibilityTimeout?: number;
  },
): Promise<Message[]> {
  const client = getSQSClient();

  const res = await client.send(
    new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: options?.maxMessages ?? 1,
      WaitTimeSeconds: options?.waitTimeSeconds ?? 20,
      VisibilityTimeout: options?.visibilityTimeout,
    }),
  );

  return res.Messages ?? [];
}

export async function deleteMessage(
  queueUrl: string,
  receiptHandle: string,
): Promise<void> {
  const client = getSQSClient();

  await client.send(
    new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    }),
  );
}

export function startVisibilityExtender(
  queueUrl: string,
  receiptHandle: string,
  visibilityTimeoutSeconds: number,
  extendEverySeconds = Math.floor(visibilityTimeoutSeconds / 2),
) {
  const client = getSQSClient();

  let stopped = false;

  const timer = setInterval(async () => {
    if (stopped) return;

    try {
      await client.send(
        new ChangeMessageVisibilityCommand({
          QueueUrl: queueUrl,
          ReceiptHandle: receiptHandle,
          VisibilityTimeout: visibilityTimeoutSeconds,
        }),
      );
    } catch (err) {
      // Log but do not crash worker
      console.error("[visibility] failed to extend", err);
    }
  }, extendEverySeconds * 1000);

  return {
    stop() {
      stopped = true;
      clearInterval(timer);
    },
  };
}
