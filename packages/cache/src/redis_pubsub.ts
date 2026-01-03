// Dedicated Redis Pub/Sub client + helpers
// IMPORTANT: This client MUST NOT be used for normal GET/SET commands

import { Redis } from "ioredis";

let pubSubClient: Redis | null = null;

/**
 * Get (or create) a Redis Pub/Sub client
 * This client is ONLY for SUBSCRIBE / UNSUBSCRIBE / PUBLISH
 */
export function getRedisPubSubClient(): Redis {
  if (!pubSubClient) {
    pubSubClient = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      maxRetriesPerRequest: null, // required for pub/sub stability
      enableReadyCheck: false,
    });

    pubSubClient.on("connect", () => {
      console.log("[Redis PubSub] connected");
    });

    pubSubClient.on("error", (err) => {
      console.error("[Redis PubSub] error", err);
    });
  }

  return pubSubClient;
}

/* -------------------------------------------------
 * Channel helpers
 * ------------------------------------------------- */

export const pubSubChannels = {
  job: (jobId: string) => `job:${jobId}`,
  document: (documentId: string) => `document:${documentId}`,
};

/* -------------------------------------------------
 * Publish helpers
 * ------------------------------------------------- */

export async function publishJobUpdate(
  jobId: string,
  payload: Record<string, any>,
) {
  const client = getRedisPubSubClient();
  try {
    await client.publish(
      pubSubChannels.job(jobId),
      JSON.stringify({
        jobId,
        ...payload,
      }),
    );
  } catch (_) {
    // best-effort
  }
}

export async function publishDocumentUpdate(
  documentId: string,
  payload: Record<string, any>,
) {
  const client = getRedisPubSubClient();
  try {
    await client.publish(
      pubSubChannels.document(documentId),
      JSON.stringify({
        documentId,
        ...payload,
      }),
    );
  } catch (_) {
    // best-effort
  }
}

/* -------------------------------------------------
 * Subscribe helpers (used by WebSocket server)
 * ------------------------------------------------- */

export async function subscribe(
  channel: string,
  handler: (payload: any) => void,
) {
  const client = getRedisPubSubClient();

  await client.subscribe(channel);

  const messageHandler = (receivedChannel: string, message: string) => {
    if (receivedChannel !== channel) return;

    try {
      handler(JSON.parse(message));
    } catch (_) {
      // ignore malformed payloads
    }
  };

  client.on("message", messageHandler);

  return async () => {
    client.off("message", messageHandler);
    await client.unsubscribe(channel);
  };
}
