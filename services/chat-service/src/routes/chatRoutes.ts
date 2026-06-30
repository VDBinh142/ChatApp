import express from 'express';
import * as RelationshipController from '../controllers/RelationshipController';
import * as ImageController from '../controllers/ImageController';
import { verifyToken } from '../middlewares/auth';
import { makeEvent } from '../../shared/events';
import validate from '../../shared/middlewares/validate';
import { friendRequestForm } from '../../shared/forms';

export const createChatRoutes = (prisma: any): express.Router => {
  const router = express.Router();
  const event = makeEvent(prisma);

  // Friendship routes (protected)
  router.post('/friendship/create', verifyToken, validate(friendRequestForm), RelationshipController.SendFriendRequest(prisma, event));
  router.put('/friendship/accept/:id', verifyToken, RelationshipController.AcceptFriendRequest(prisma, event));
  router.put('/friendship/reject/:id', verifyToken, RelationshipController.RejectFriendRequest(prisma, event));
  router.put('/friendship/deny/:id', verifyToken, RelationshipController.RejectFriendRequest(prisma, event)); // Alias for reject
  router.get('/friendship', verifyToken, RelationshipController.GetFriendsRequest(prisma));
  router.get('/friendship/requests', verifyToken, RelationshipController.GetFriendsRequest(prisma)); // Alias

  // Image routes (protected)
  router.post('/upload', verifyToken, ImageController.uploadImageMiddleware, ImageController.uploadImage(prisma, event));
  router.get('/images/:imageName', ImageController.getImage(prisma));

  return router;
};
