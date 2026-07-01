import { Redis } from "ioredis";

let client: Redis | null = null;

export async function connectToIoRedis() {
  if (client) return client;
  if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
    throw new Error(
      "Redis connection parameters (REDIS_HOST, REDIS_PORT) are not set in environment variables"
    );
  }

  const opts: any = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    lazyConnect: true,
  };

  if (process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD.length > 0) {
    opts.password = process.env.REDIS_PASSWORD;
    if (process.env.REDIS_USERNAME && process.env.REDIS_USERNAME.length > 0) {
      opts.username = process.env.REDIS_USERNAME;
    }
  }

  client = new Redis(opts);

  // Manually connect and wait for ready state
  await client.connect();

  console.log("Connected to Redis");
  return client;
}

export async function getIoClient() {
  if (!client) {
    await connectToIoRedis();
  }
  return client as Redis;
}

export function disconnectFromIoRedis() {
  if (client) {
    client.disconnect();
    console.log("Disconnected from Redis");
    client = null;
  }
}
