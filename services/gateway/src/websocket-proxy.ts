import { Server as HTTPServer } from 'http';
import { WebSocket, Server as WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';

/**
 * WebSocket proxy for routing upgrade requests to appropriate services
 * - /ws/chat → chat-service
 * - /ws/presence → presence-service
 */

export function setupWebSocketProxy(server: HTTPServer) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    try {
      // Verify JWT from query params or headers
      const token = 
        new URLSearchParams(req.url?.split('?')[1] || '').get('token') ||
        req.headers['authorization']?.replace('Bearer ', '');

      if (!token) {
        ws.close(4001, 'No token provided');
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        username: string;
        userId?: string;
      };

      // Attach user info to socket
      (ws as any).userId = decoded.userId;
      (ws as any).username = decoded.username;

      // Route based on URL path
      const path = req.url?.split('?')[0] || '/';

      if (path.includes('/chat')) {
        // Proxy to chat-service WebSocket
        console.log(`[Gateway] Routing chat WebSocket for user ${decoded.username}`);
        // TODO: Forward to chat-service WebSocket (requires ws-proxy library or custom implementation)
      } else if (path.includes('/presence')) {
        // Proxy to presence-service WebSocket
        console.log(`[Gateway] Routing presence WebSocket for user ${decoded.username}`);
        // TODO: Forward to presence-service WebSocket
      } else {
        ws.close(4404, 'Unknown WebSocket path');
      }
    } catch (error) {
      console.error('[Gateway] WebSocket auth error:', error);
      ws.close(4401, 'Invalid token');
    }
  });

  console.log('[Gateway] WebSocket proxy initialized');
}
