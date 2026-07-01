import { getClient } from "../services/redis";

export const FRIEND_EVENTS_CHANNEL = "friend-events";

export interface FriendEventPayload {
  eventType:
    | "FRIEND_REQUEST_RECEIVED"
    | "FRIEND_REQUEST_ACCEPTED"
    | "FRIEND_REQUEST_DECLINED"
    | "FRIEND_REMOVED";
  [key: string]: unknown;
}

/**
 * Publish a friend-related event addressed to a specific user.
 * This is purely a live notification mechanism - if the user isn't
 * connected, the event is simply dropped. All durable state lives in
 * Postgres (FriendRequest / Friendship tables), never here.
 */
export async function publishFriendEvent(
  targetUsername: string,
  payload: FriendEventPayload
): Promise<void> {
  const client = await getClient();
  if (!client) return;
  await client.publish(
    FRIEND_EVENTS_CHANNEL,
    JSON.stringify({ targetUsername, ...payload })
  );
}
