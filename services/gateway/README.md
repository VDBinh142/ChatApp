# Gateway Service

API Gateway for the Real-Time Chat Application.

## Responsibilities
- **JWT Verification** — Validates all incoming requests (except `/auth` and `/health`)
- **HTTP Routing** — Proxies requests to microservices using `http-proxy-middleware`
- **WebSocket Upgrades** — Routes WebSocket connections to chat-service and presence-service
- **Rate Limiting** — (Optional) Can be added per route

## Environment Variables
```bash
PORT=3000                                      # Gateway port
JWT_SECRET=your_secret_key                    # JWT signing secret
AUTH_SERVICE_URL=http://localhost:3001        # Auth service URL
CHAT_SERVICE_URL=http://localhost:3002        # Chat service URL
PRESENCE_SERVICE_URL=http://localhost:3003    # Presence service URL
NOTIFICATION_SERVICE_URL=http://localhost:3004 # Notification service URL
```

## Routes
- `GET /health` — Health check (no auth)
- `POST /auth/register` → proxies to auth-service
- `POST /auth/login` → proxies to auth-service
- `POST /auth/logout` → proxies to auth-service (requires JWT)
- `POST /chat/upload` → proxies to chat-service (requires JWT)
- `GET /chat/images/:imageName` → proxies to chat-service
- `POST /chat/friendship/create` → proxies to chat-service (requires JWT)
- `WS /ws/chat?token=xyz` — WebSocket to chat-service
- `WS /ws/presence?token=xyz` — WebSocket to presence-service
