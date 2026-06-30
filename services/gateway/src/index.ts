import express from 'express';
import http from 'http';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { handleError } from '../../shared/errors';
import { verifyToken } from './middlewares/auth';
import { setupWebSocketProxy } from './websocket-proxy';

/**
 * API Gateway
 * - Single entry point at port 3000
 * - JWT verification for protected routes
 * - Routes HTTP requests to microservices
 * - Upgrades WebSocket connections
 */

const app = express();
app.use(express.json());

// Health check (no auth needed)
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'gateway', timestamp: new Date().toISOString() })
);

// Public auth routes (bypass JWT verification)
app.use(
  '/auth',
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: { '^/auth': '/auth' },
    logLevel: 'info',
  })
);

// JWT verification for all other routes
app.use(verifyToken);

// Protected chat routes
app.use(
  '/chat',
  createProxyMiddleware({
    target: process.env.CHAT_SERVICE_URL || 'http://localhost:3002',
    changeOrigin: true,
    pathRewrite: { '^/chat': '/chat' },
    logLevel: 'info',
  })
);

// Protected presence routes
app.use(
  '/presence',
  createProxyMiddleware({
    target: process.env.PRESENCE_SERVICE_URL || 'http://localhost:3003',
    changeOrigin: true,
    pathRewrite: { '^/presence': '/presence' },
    logLevel: 'info',
  })
);

// Protected notification routes
app.use(
  '/notification',
  createProxyMiddleware({
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004',
    changeOrigin: true,
    pathRewrite: { '^/notification': '/notification' },
    logLevel: 'info',
  })
);

// Error handler (must be last)
app.use(handleError);

const server = http.createServer(app);

// Setup WebSocket proxy for upgrade events
setupWebSocketProxy(server);

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`🚀 Gateway listening on port ${port}`);
});

