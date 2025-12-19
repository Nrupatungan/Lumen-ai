import {
  DeleteMessageCommand,
  Message,
  ReceiveMessageCommand,
  SendMessageCommand,
} from "@aws-sdk/client-sqs";
import { getSQSClient } from "./clients.js";

export async function sendMessage<T>(
  queueUrl: string,
  message: T
): Promise<void> {
  const client = getSQSClient();

  await client.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(message),
    })
  );
}

export async function receiveMessages(
  queueUrl: string,
  options?: {
    maxMessages?: number;
    waitTimeSeconds?: number;
    visibilityTimeout?: number;
  }
): Promise<Message[]> {
  const client = getSQSClient();

  const res = await client.send(
    new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: options?.maxMessages ?? 1,
      WaitTimeSeconds: options?.waitTimeSeconds ?? 20,
      VisibilityTimeout: options?.visibilityTimeout,
    })
  );

  return res.Messages ?? [];
}

export async function deleteMessage(
  queueUrl: string,
  receiptHandle: string
): Promise<void> {
  const client = getSQSClient();

  await client.send(
    new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    })
  );
}
