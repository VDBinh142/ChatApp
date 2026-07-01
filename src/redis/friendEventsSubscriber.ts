import { createClient } from "redis";
import { chatConnectionManager } from "../services/connectionService";
import { WsResponse } from "../utils/wsResponse";
import { FRIEND_EVENTS_CHANNEL } from "./friendEventsPublisher";

export async function subscribeToFriendEvents(): Promise<void> {
  if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
    throw new Error(
      "Redis connection parameters (REDIS_HOST, REDIS_PORT) are not set in environment variables"
    );
  }

  const socket = { host: process.env.REDIS_HOST, port: parseInt(process.env.REDIS_PORT) };
  const clientOptions: any = { socket };
  if (process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD.length > 0) {
    clientOptions.password = process.env.REDIS_PASSWORD;
    if (process.env.REDIS_USERNAME && process.env.REDIS_USERNAME.length > 0) {
      clientOptions.username = process.env.REDIS_USERNAME;
    }
  }

  const subscriber = createClient(clientOptions);

  await subscriber.connect();

  await subscriber.subscribe(FRIEND_EVENTS_CHANNEL, (message) => {
    try {
      const payload = JSON.parse(message);
      const { targetUsername, eventType, ...rest } = payload;
      const ws = chatConnectionManager.getSocket(targetUsername);
      if (ws) {
        WsResponse.custom(ws, { type: "FRIEND_EVENT", eventType, ...rest });
      }
    } catch (error) {
      console.error("Error handling friend event:", error);
    }
  });

  console.log("Subscribed to friend events");
}
