import { createClient, RedisClientType } from "redis";

let client: RedisClientType | null = null;

export async function connectToRedis() {
  if (client) return client;
  if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
    throw new Error(
      "Redis connection parameters (REDIS_HOST, REDIS_PORT) are not set in environment variables"
    );
  }

  const socket = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
  };

  const clientOptions: any = { socket };

  // Only set password/username when provided (allow empty password for local Redis)
  if (process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD.length > 0) {
    clientOptions.password = process.env.REDIS_PASSWORD;
    // some Redis setups require username (ACL); only include if provided
    if (process.env.REDIS_USERNAME && process.env.REDIS_USERNAME.length > 0) {
      clientOptions.username = process.env.REDIS_USERNAME;
    }
  }

  client = createClient(clientOptions);
  await client.connect();
  console.log("Connected to Redis");
  return client;
}

export async function getClient() {
  if (!client) {
    await connectToRedis();
  }
  return client;
}

export function disconnectFromRedis() {
  if (client) {
    client.destroy();
    console.log("Disconnected from Redis");
    client = null;
  }
}
