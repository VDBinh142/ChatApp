import { WebSocket } from "ws";
import { chatConnectionManager } from "../../services/connectionService";
import { prisma } from "../../services/prisma";
import { WsResponse } from "../../utils/wsResponse";
import { WsValidation } from "../../utils/wsValidation";
import {
  FetchFriendRequestsMessage,
  FetchFriendsMetaMessage,
} from "../../types/messageTypes";

/**
 * Friend request *mutations* (send / accept / decline) are handled over
 * HTTP via POST/PUT /api/friends/* (see src/apiRoutes.ts +
 * src/controllers/friendController.ts), with Postgres as the single source
 * of truth. These WebSocket handlers are read-only - they let an already
 * connected client pull the current state on demand. Live push
 * notifications for new requests/responses arrive separately via
 * src/redis/friendEventsSubscriber.ts, which listens to the same Redis
 * channel the HTTP controller publishes to.
 */

export async function fetchFriendRequestsHandler(
  ws: WebSocket,
  parsed: FetchFriendRequestsMessage
): Promise<void> {
  const { username } = parsed;
  if (!username) {
    WsResponse.error(ws, "Username is required to fetch friend requests.");
    return;
  }

  if (!(await WsValidation.validateUser(ws, username))) return;

  try {
    const [incoming, outgoing] = await Promise.all([
      prisma.friendRequest.findMany({
        where: { receiverId: username, status: "PENDING" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.friendRequest.findMany({
        where: { senderId: username, status: "PENDING" },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    WsResponse.custom(ws, {
      type: "FETCH_FRIEND_REQUESTS_RESPONSE",
      incomingRequests: incoming,
      outgoingRequests: outgoing,
    });
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    WsResponse.error(ws, "Unable to fetch friend requests.");
  }
}

export async function fetchFriendsMetaHandler(
  ws: WebSocket,
  _parsed: FetchFriendsMetaMessage
): Promise<void> {
  const username = chatConnectionManager.getUsername(ws);
  if (!username) {
    WsResponse.error(ws, "Unable to identify current user.");
    return;
  }

  if (!(await WsValidation.validateUser(ws, username))) return;

  try {
    const [friendships, incoming, outgoing] = await Promise.all([
      prisma.friendship.findMany({
        where: { OR: [{ user1: username }, { user2: username }] },
      }),
      prisma.friendRequest.findMany({
        where: { receiverId: username, status: "PENDING" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.friendRequest.findMany({
        where: { senderId: username, status: "PENDING" },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const friends = friendships.map((friendship) =>
      friendship.user1 === username ? friendship.user2 : friendship.user1
    );

    WsResponse.custom(ws, {
      type: "FETCH_FRIENDS_META_RESPONSE",
      friends,
      incomingRequests: incoming,
      outgoingRequests: outgoing,
    });
  } catch (error) {
    console.error("Error fetching friends meta:", error);
    WsResponse.error(ws, "Unable to fetch friends data.");
  }
}
