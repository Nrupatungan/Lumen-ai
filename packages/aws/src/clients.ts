import { S3Client } from "@aws-sdk/client-s3";
import { SQSClient } from "@aws-sdk/client-sqs";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

let _s3Client: S3Client | null = null;
let _sqsClient: SQSClient | null = null;

export function getS3Client(): S3Client {
  if (_s3Client) return _s3Client;

  const region = requireEnv("AWS_REGION");
  const endpoint = process.env.AWS_ENDPOINT;

  _s3Client = new S3Client({
    region,
    endpoint,
    forcePathStyle: Boolean(endpoint), // ONLY for LocalStack
  });

  return _s3Client;
}

export function getSQSClient(): SQSClient {
  if (_sqsClient) return _sqsClient;

  const region = requireEnv("AWS_REGION");
  const endpoint = process.env.AWS_ENDPOINT;

  _sqsClient = new SQSClient({
    region,
    endpoint,
  });

  return _sqsClient;
}
