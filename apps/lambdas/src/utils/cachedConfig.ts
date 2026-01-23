import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({
  region: String(process.env.AWS_REGION),
});

async function getSecret(name: string) {
  const res = await client.send(new GetSecretValueCommand({ SecretId: name }));
  return res.SecretString!;
}

// cached across invocations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedConfig: any;

export async function loadConfig() {
  if (cachedConfig) return cachedConfig;

  cachedConfig = {
    MONGO_URI: await getSecret(process.env.MONGO_URI!),
    URL: await getSecret(process.env.UPSTASH_REDIS_REST_URL!),
    TOKEN: await getSecret(process.env.UPSTASH_REDIS_REST_TOKEN!),
  };

  return cachedConfig;
}
