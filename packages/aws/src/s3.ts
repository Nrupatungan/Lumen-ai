import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { getS3Client } from "./clients.js";

export async function uploadStreamToS3(
  bucket: string,
  key: string,
  stream: Readable,
  contentType: string
): Promise<void> {
  const client = getS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: stream,
      ContentType: contentType,
    })
  );
}

export async function getObjectStream(
  bucket: string,
  key: string
): Promise<Readable> {
  const client = getS3Client();

  const res = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  );

  return res.Body as Readable;
}
