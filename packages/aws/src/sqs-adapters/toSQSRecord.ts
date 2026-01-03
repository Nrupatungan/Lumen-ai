import type { Message, MessageAttributeValue } from "@aws-sdk/client-sqs";
import type { SQSRecord, SQSMessageAttributes } from "aws-lambda";

function normalizeMessageAttributes(
  attrs?: Record<string, MessageAttributeValue>,
): SQSMessageAttributes {
  if (!attrs) return {};

  const normalized: SQSMessageAttributes = {};

  for (const [key, value] of Object.entries(attrs)) {
    normalized[key] = {
      dataType: value.DataType ?? "String",
      stringValue: value.StringValue,
      binaryValue: value.BinaryValue
        ? Buffer.from(value.BinaryValue).toString("base64")
        : undefined,
    };
  }

  return normalized;
}

/**
 * Converts AWS SDK SQS Message → Lambda-compatible SQSRecord
 */
export function toSQSRecord(
  msg: Message,
  params: {
    queueArn: string;
    region: string;
    defaultSenderId?: string;
  },
): SQSRecord {
  const now = Date.now().toString();

  return {
    messageId: msg.MessageId ?? "",
    receiptHandle: msg.ReceiptHandle ?? "",
    body: msg.Body ?? "",
    attributes: {
      ApproximateReceiveCount: msg.Attributes?.ApproximateReceiveCount ?? "1",
      SentTimestamp: msg.Attributes?.SentTimestamp ?? now,
      SenderId:
        msg.Attributes?.SenderId ?? params.defaultSenderId ?? "local-worker",
      ApproximateFirstReceiveTimestamp:
        msg.Attributes?.ApproximateFirstReceiveTimestamp ?? now,
    },
    messageAttributes: normalizeMessageAttributes(msg.MessageAttributes),
    md5OfBody: msg.MD5OfBody ?? "",
    eventSource: "aws:sqs",
    eventSourceARN: params.queueArn,
    awsRegion: params.region,
  };
}
