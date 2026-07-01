import { Request, Response } from "express";
import { prisma } from "../services/prisma";
import { KnownErrors } from "../errors";
import { generateChatId } from "../utils/chatId";
import { queueFriendRequestEmail } from "../queue/emailQueue";
import { publishFriendEvent } from "../redis/friendEventsPublisher";

/**
 * POST /api/friends/requests
 * Send a friend request. Source of truth is Postgres (FriendRequest table),
 * not Redis - Redis is only used afterwards to push a live notification if
 * the receiver is currently connected.
 */
export async function sendFriendRequest(req: Request, res: Response): Promise<void> {
  const senderId = req.username!;
  const { receiverId, content } = req.body;

  if (senderId === receiverId) {
    throw new KnownErrors("ERR_FRIEND_REQUEST_SELF");
  }

  const receiver = await prisma.user.findUnique({ where: { username: receiverId } });
  if (!receiver) {
    throw new KnownErrors("ERR_USER_NOT_FOUND");
  }

  const chatId = generateChatId(senderId, receiverId);
  const existingFriendship = await prisma.friendship.findUnique({ where: { chatId } });
  if (existingFriendship) {
    throw new KnownErrors("ERR_ALREADY_FRIENDS");
  }

  const existingRequest = await prisma.friendRequest.findFirst({
    where: {
      status: "PENDING",
      OR: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    },
  });
  if (existingRequest) {
    throw new KnownErrors("ERR_FRIEND_REQUEST_ALREADY_EXISTS");
  }

  const friendRequest = await prisma.friendRequest.create({
    data: { senderId, receiverId, content },
  });

  await publishFriendEvent(receiverId, {
    eventType: "FRIEND_REQUEST_RECEIVED",
    requestId: friendRequest.id,
    from: senderId,
  });

  await queueFriendRequestEmail({ senderId, receiverId });

  res.status(201).json({ message: "Friend request sent", request: friendRequest });
}

/**
 * GET /api/friends/requests
 * List incoming and outgoing pending requests for the current user.
 */
export async function listFriendRequests(req: Request, res: Response): Promise<void> {
  const username = req.username!;

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

  res.json({ incoming, outgoing });
}

/**
 * PUT /api/friends/requests/:id
 * Accept or decline a pending friend request. Only the receiver may respond.
 */
export async function respondFriendRequest(req: Request, res: Response): Promise<void> {
  const username = req.username!;
  const { id } = req.params;
  const { accept } = req.body;

  const friendRequest = await prisma.friendRequest.findUnique({ where: { id } });
  if (!friendRequest || friendRequest.status !== "PENDING") {
    throw new KnownErrors("ERR_FRIEND_REQUEST_NOT_FOUND");
  }
  if (friendRequest.receiverId !== username) {
    throw new KnownErrors("ERR_NOT_REQUEST_RECEIVER");
  }

  if (accept) {
    const chatId = generateChatId(friendRequest.senderId, friendRequest.receiverId);
    await prisma.$transaction([
      prisma.friendRequest.update({
        where: { id },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      }),
      prisma.friendship.create({
        data: {
          chatId,
          user1: friendRequest.senderId,
          user2: friendRequest.receiverId,
        },
      }),
    ]);

    await publishFriendEvent(friendRequest.senderId, {
      eventType: "FRIEND_REQUEST_ACCEPTED",
      by: username,
    });

    res.json({ message: "Friend request accepted" });
    return;
  }

  await prisma.friendRequest.update({
    where: { id },
    data: { status: "DECLINED", respondedAt: new Date() },
  });

  await publishFriendEvent(friendRequest.senderId, {
    eventType: "FRIEND_REQUEST_DECLINED",
    by: username,
  });

  res.json({ message: "Friend request declined" });
}

/**
 * GET /api/friends
 * List the current user's accepted friends.
 */
export async function listFriends(req: Request, res: Response): Promise<void> {
  const username = req.username!;

  const friendships = await prisma.friendship.findMany({
    where: { OR: [{ user1: username }, { user2: username }] },
    include: {
      user1Rel: { select: { username: true, displayName: true, avatarImage: true } },
      user2Rel: { select: { username: true, displayName: true, avatarImage: true } },
    },
  });

  const friends = friendships.map((f) =>
    f.user1 === username ? f.user2Rel : f.user1Rel
  );

  res.json({ friends });
}

/**
 * DELETE /api/friends/:username
 * Remove a friendship. Either side can remove it.
 */
export async function deleteFriend(req: Request, res: Response): Promise<void> {
  const username = req.username!;
  const otherUser = req.params.username;

  const chatId = generateChatId(username, otherUser);
  const friendship = await prisma.friendship.findUnique({ where: { chatId } });
  if (!friendship) {
    throw new KnownErrors("ERR_NOT_FRIENDS");
  }

  await prisma.friendship.delete({ where: { chatId } });

  await publishFriendEvent(otherUser, {
    eventType: "FRIEND_REMOVED",
    by: username,
  });

  res.json({ message: "Friend removed" });
}
