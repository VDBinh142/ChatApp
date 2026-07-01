import { Worker } from "bullmq";
import { createClient, RedisClientType } from "redis";
import { sendFriendRequestEmail } from "../utils/emailSender";
import { logger } from "../utils/logger";
import { FriendRequestEmailJob } from "./emailQueue";

let emailWorker: Worker | null = null;

export async function startEmailWorker(): Promise<void> {
  if (emailWorker) return;
  // Build a node-redis client for BullMQ and ensure
  // `maxRetriesPerRequest` is null as required by BullMQ.
  if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
    throw new Error("Redis connection parameters (REDIS_HOST, REDIS_PORT) are not set in environment variables");
  }

  const socket = { host: process.env.REDIS_HOST, port: parseInt(process.env.REDIS_PORT) };
  const redisOptions: any = { socket, maxRetriesPerRequest: null };

  if (process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD.length > 0) {
    redisOptions.password = process.env.REDIS_PASSWORD;
    if (process.env.REDIS_USERNAME && process.env.REDIS_USERNAME.length > 0) {
      redisOptions.username = process.env.REDIS_USERNAME;
    }
  }

  const redisClient: RedisClientType = createClient(redisOptions);
  await redisClient.connect();

  emailWorker = new Worker<FriendRequestEmailJob>(
    "emails",
    async (job) => {
      if (job.name === "friend-request-email") {
        await sendFriendRequestEmail(job.data.senderId, job.data.receiverId);
      }
    },
    { connection: redisClient as any }
  );

  emailWorker.on("failed", (job, err) => {
    logger.error(`Email job ${job?.id} failed: ${err.message}`);
  });

  logger.info("📧 Email worker started");
}
