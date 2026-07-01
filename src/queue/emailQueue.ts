import { Queue } from "bullmq";
import { getIoClient } from "../services/ioredis";

let emailQueue: Queue | null = null;

export interface FriendRequestEmailJob {
  senderId: string;
  receiverId: string;
}

export async function getEmailQueue(): Promise<Queue> {
  if (!emailQueue) {
    const ioredis = await getIoClient();
    emailQueue = new Queue("emails", { connection: ioredis });
  }
  return emailQueue;
}

export async function queueFriendRequestEmail(
  data: FriendRequestEmailJob
): Promise<void> {
  const queue = await getEmailQueue();
  await queue.add("friend-request-email", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: true,
    removeOnFail: false,
  });
}
