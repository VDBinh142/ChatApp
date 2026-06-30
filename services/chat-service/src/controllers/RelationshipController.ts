import { Handler } from 'express';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { KnownErrors } from '../../../shared/errors';
import { EVENTS } from '../../../shared/events/type';
import connectToRabbitMQ from '../../../shared/rabbitmq/rabbitmq';
import { sendMessageToEmailQueue } from '../../../shared/rabbitmq/queues';

export const SendFriendRequest = (database: PrismaClient, event: EventEmitter): Handler => async (req: Request, res: Response) => {
  const { receiverId, content } = req.body;
  const senderId = req.userId as string;

  console.log('Sender ID:', senderId);
  console.log('Receiver ID:', receiverId);

  const friendsRequest = await database.friendRequest.create({
    data: {
      senderId,
      receiverId,
      content,
    },
  });

  try {
    const connection = await connectToRabbitMQ();
    const channel = await connection.createChannel();
    await sendMessageToEmailQueue(channel, 'emailQueue', senderId, receiverId, { content });
    await connection.close();
  } catch (error) {
    console.error('Failed to send to RabbitMQ:', error);
  }

  event.emit(EVENTS.FRIEND_REQUEST_SENT, friendsRequest);
  res.json(friendsRequest);
};

export const AcceptFriendRequest = (database: PrismaClient, event: EventEmitter): Handler => async (req: Request, res: Response) => {
  const { id } = req.params;

  const updatedRequest = await database.friendRequest.update({
    where: { id },
    data: { acceptedAt: new Date() },
  });

  event.emit(EVENTS.FRIEND_REQUEST_ACCEPTED, updatedRequest);
  res.json(updatedRequest);
};

export const RejectFriendRequest = (database: PrismaClient, event: EventEmitter): Handler => async (req: Request, res: Response) => {
  const { id } = req.params;

  const updatedRequest = await database.friendRequest.update({
    where: { id },
    data: { rejectedAt: new Date() },
  });

  event.emit(EVENTS.FRIEND_REQUEST_DECLINED, updatedRequest);
  res.json(updatedRequest);
};

export const GetFriendsRequest = (database: PrismaClient): Handler => async (req: Request, res: Response) => {
  const userId = req.userId;

  const friendRequests = await database.friendRequest.findMany({
    where: {
      OR: [{ senderId: String(userId) }, { receiverId: String(userId) }],
    },
    include: {
      sender: { select: { id: true, username: true } },
      receiver: { select: { id: true, username: true } },
    },
  });

  res.json(friendRequests);
};
