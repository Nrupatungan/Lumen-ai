import {
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { getS3Client } from "./clients.js";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function uploadStreamToS3(
  bucket: string,
  key: string,
  stream: Readable,
  contentType: string,
): Promise<void> {
  const client = getS3Client();

  const upload = new Upload({
    client,
    params: {
      Bucket: bucket,
      Key: key,
      Body: stream,
      ContentType: contentType,
    },
  });

  await upload.done();
}

export async function getObjectStream(
  bucket: string,
  key: string,
): Promise<Readable> {
  const client = getS3Client();

  const res = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );

  if (!res.Body) {
    throw new Error("S3 object body is empty");
  }

  // Node.js environment (LocalStack + AWS)
  if (res.Body instanceof Readable) {
    return res.Body;
  }

  // Fallback safety (shouldn't happen in Node, but safe)
  return Readable.from(res.Body as any);
}

export async function deleteObject(
  bucket: string,
  key: string,
): Promise<void> {
  const client = getS3Client();

  await client.send(
    new DeleteObjectCommand({ Bucket: bucket, Key: key })
  );
}

export async function getObjectUrl(
  bucket: string,
  key: string
): Promise<string> {
  const client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return await getSignedUrl(client, command, {
    expiresIn: Number(process.env.S3_SIGNED_URL_EXPIRY),
  });
}