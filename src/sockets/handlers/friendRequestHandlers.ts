import { WebSocket } from "ws";
import { chatConnectionManager } from "../../services/connectionService";
import { prisma } from "../../services/prisma";
import { getClient } from "../../services/redis";
import { WsResponse } from "../../utils/wsResponse";
import { WsValidation } from "../../utils/wsValidation";
import { generateChatId } from "../../utils/chatId";
import {
  FetchFriendRequestsMessage,
  FetchFriendsMetaMessage,
  RespondFriendRequestMessage,
  SendFriendRequestMessage,
} from "../../types/messageTypes";

const friendRequestKey = (from: string, to: string) =>
  `friendrequest:${from}:${to}`;
const incomingRequestsKey = (username: string) =>
  `friendrequests:${username}`;
const outgoingRequestsKey = (username: string) =>
  `friendrequests:outgoing:${username}`;

interface PendingFriendRequest {
  requester: string;
  recipient: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: string;
}

function parsePendingRequest(value: string): PendingFriendRequest | null {
  try {
    const parsed = JSON.parse(value);
    if (
      parsed &&
      typeof parsed.requester === "string" &&
      typeof parsed.recipient === "string"
    ) {
      return {
        requester: parsed.requester,
        recipient: parsed.recipient,
        status: parsed.status || "PENDING",
        createdAt: parsed.createdAt || new Date().toISOString(),
      };
    }
  } catch {
    return null;
  }
  return null;
}

async function readRequestList(username: string, keyFn: (u: string) => string) {
  const redis = await getClient();
  if (!redis) return [] as PendingFriendRequest[];
  const raw = await redis.lRange(keyFn(username), 0, -1);
  return raw
    .map(parsePendingRequest)
    .filter((item): item is PendingFriendRequest => item !== null);
}

export async function sendFriendRequestHandler(
  ws: WebSocket,
  parsed: SendFriendRequestMessage
): Promise<void> {
  const { from, to } = parsed;
  if (!from || !to) {
    WsResponse.error(ws, "Both sender and recipient are required.");
    return;
  }

  if (from === to) {
    WsResponse.error(ws, "You cannot send a friend request to yourself.");
    return;
  }

  if (!(await WsValidation.validateUser(ws, from))) return;
  if (!(await WsValidation.validateUser(ws, to))) return;

  try {
    const chatId = generateChatId(from, to);
    const existingFriendship = await prisma.friendship.findUnique({
      where: { chatId },
    });

    if (existingFriendship) {
      WsResponse.error(ws, `${to} is already your friend.`);
      return;
    }

    const redis = await getClient();
    if (!redis) {
      WsResponse.error(ws, "Friend request service unavailable.");
      return;
    }

    const outgoingKey = friendRequestKey(from, to);
    const incomingKey = friendRequestKey(to, from);

    if (await redis.exists(outgoingKey)) {
      WsResponse.error(ws, `Friend request already sent to ${to}.`);
      return;
    }

    if (await redis.exists(incomingKey)) {
      WsResponse.error(
        ws,
        `You already have a pending friend request from ${to}.`,
      );
      return;
    }

    const request = {
      requester: from,
      recipient: to,
      status: "PENDING" as const,
      createdAt: new Date().toISOString(),
    };

    await Promise.all([
      redis.set(outgoingKey, JSON.stringify(request)),
      redis.lPush(incomingRequestsKey(to), JSON.stringify(request)),
      redis.lPush(outgoingRequestsKey(from), JSON.stringify(request)),
    ]);

    const recipientSocket = chatConnectionManager.getSocket(to);
    if (recipientSocket) {
      WsResponse.custom(recipientSocket, {
        type: "FRIEND_REQUEST_RECEIVED",
        from,
        to,
        status: "PENDING",
      });
    }

    WsResponse.success(ws, `Friend request sent to ${to}.`);
  } catch (error) {
    console.error("Error sending friend request:", error);
    WsResponse.error(ws, "Unable to send friend request.");
  }
}

export async function respondFriendRequestHandler(
  ws: WebSocket,
  parsed: RespondFriendRequestMessage
): Promise<void> {
  const { from, to, accept } = parsed;
  if (!from || !to) {
    WsResponse.error(ws, "Both requester and responder are required.");
    return;
  }

  if (!(await WsValidation.validateUser(ws, from))) return;
  if (!(await WsValidation.validateUser(ws, to))) return;

  try {
    const redis = await getClient();
    if (!redis) {
      WsResponse.error(ws, "Friend request service unavailable.");
      return;
    }

    const requestKey = friendRequestKey(to, from);
    const stored = await redis.get(requestKey);
    if (!stored) {
      WsResponse.error(ws, "No pending friend request found.");
      return;
    }

    const pendingRequest = parsePendingRequest(stored);
    if (!pendingRequest) {
      WsResponse.error(ws, "Invalid friend request data.");
      return;
    }

    const requesterSocket = chatConnectionManager.getSocket(to);
    const recipientSocket = ws;
    const chatId = generateChatId(to, from);

    await Promise.all([
      redis.del(requestKey),
      redis.lRem(incomingRequestsKey(from), 0, stored),
      redis.lRem(outgoingRequestsKey(to), 0, stored),
    ]);

    if (accept) {
      const existingFriendship = await prisma.friendship.findUnique({
        where: { chatId },
      });

      if (!existingFriendship) {
        await prisma.friendship.create({
          data: {
            chatId,
            user1: chatId.split("-")[0],
            user2: chatId.split("-")[1],
          },
        });
      }
    }

    if (requesterSocket) {
      WsResponse.custom(requesterSocket, {
        type: "FRIEND_REQUEST_RESPONSE",
        from,
        to,
        accepted: accept,
        chatId: accept ? chatId : undefined,
      });
    }

    WsResponse.custom(recipientSocket, {
      type: "FRIEND_REQUEST_RESPONSE",
      from,
      to,
      accepted: accept,
      chatId: accept ? chatId : undefined,
    });
  } catch (error) {
    console.error("Error responding to friend request:", error);
    WsResponse.error(ws, "Unable to respond to friend request.");
  }
}

export async function fetchFriendRequestsHandler(
  ws: WebSocket,
  parsed: FetchFriendRequestsMessage,
): Promise<void> {
  const { username } = parsed;
  if (!username) {
    WsResponse.error(ws, "Username is required to fetch friend requests.");
    return;
  }

  if (!(await WsValidation.validateUser(ws, username))) return;

  try {
    const incoming = await readRequestList(username, incomingRequestsKey);
    const outgoing = await readRequestList(username, outgoingRequestsKey);

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
  parsed: FetchFriendsMetaMessage,
): Promise<void> {
  const username = chatConnectionManager.getUsername(ws);
  if (!username) {
    WsResponse.error(ws, "Unable to identify current user.");
    return;
  }

  if (!(await WsValidation.validateUser(ws, username))) return;

  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ user1: username }, { user2: username }],
      },
    });

    const friends = friendships.map((friendship) =>
      friendship.user1 === username ? friendship.user2 : friendship.user1,
    );

    const incoming = await readRequestList(username, incomingRequestsKey);
    const outgoing = await readRequestList(username, outgoingRequestsKey);

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
