import express from 'express';
import { handleError } from '../../shared/errors';

export const createNotificationRoutes = (): express.Router => {
  const router = express.Router();

  // Health check
  router.get('/health', (_req, res) => res.json({ status: 'ok', service: 'notification' }));

  // TODO: Add notification routes when workers are set up
  // - Consume offline message events
  // - Push delivery on reconnect
  // - Manage offline message queue

  return router;
};

export default createNotificationRoutes();
