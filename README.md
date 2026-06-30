# Real-Time Chat Application - Microservices Architecture

A scalable, event-driven real-time chat application built with **microservices architecture**, featuring JWT authentication, WebSocket support, friend request system with email notifications, and multi-database persistence.

## 🏗️ Architecture

The application is split into **5 microservices** that communicate via HTTP, WebSockets, RabbitMQ events, and shared databases:

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client Applications                         │
│                    (Web, Mobile, Desktop)                            │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API Gateway (3000)                           │
│                    - JWT Verification                               │
│                    - Request Routing                                │
│                    - WebSocket Upgrade                              │
└──────┬──────────┬──────────┬──────────┬──────────────────────────────┘
       │          │          │          │
    3001      3002       3003       3004
       ▼          ▼          ▼          ▼
┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐
│   Auth   │ │  Chat    │ │ Presence │ │  Notification    │
│ Service  │ │ Service  │ │ Service  │ │    Service       │
│          │ │ + Images │ │ + Online │ │ + Email Worker   │
│ - JWT    │ │          │ │ Tracking │ │                  │
│ - Users  │ │ - Friends│ │          │ │ - Consumes       │
│ - Auth   │ │ - Groups │ │ - Sockets│ │   RabbitMQ       │
│          │ │ - Messag│ │          │ │ - Sends Emails   │
└──────────┘ │  -Sockets│ │ - Redis  │ └──────────────────┘
             └──────────┘ └──────────┘
                 ▼
         ┌──────────────────────┐
         │  Shared Infrastructure │
         │  - PostgreSQL (Users) │
         │  - PostgreSQL (Chat)  │
         │  - Cassandra (Messages)
         │  - Redis (Cache/Presence/PubSub)
         │  - RabbitMQ (Events) │
         └──────────────────────┘
```

## 📦 Services

| Service | Port | Responsibility | Database |
|---------|------|---|---|
| **Gateway** | 3000 | JWT verification, routing, WebSocket upgrade | — |
| **Auth** | 3001 | User registration, login, JWT issuance | PostgreSQL |
| **Chat** | 3002 | Messages, groups, friends, images | PostgreSQL + Cassandra |
| **Presence** | 3003 | Online/offline status, heartbeat | Redis |
| **Notification** | 3004 | Email delivery, offline message queue | PostgreSQL |

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- npm or yarn

### Start All Services
```bash
# Clone repository
git clone <repo-url>
cd Real-Time-Chat-App

# Start all services (PostgreSQL, Cassandra, Redis, RabbitMQ, and 5 microservices)
docker-compose up

# Wait for all services to be healthy
# Look for: ✅ {service-name} listening on port {port}
```

### Local Development (Without Docker)
```bash
# Install dependencies (from root)
npm install

# Setup environment variables
cp .env.example .env

# Start auth-service
cd services/auth-service && npm install && npm run dev

# Start chat-service (in another terminal)
cd services/chat-service && npm install && npm run dev

# Start other services similarly...
```

## 📡 API Endpoints

### Authentication
```bash
# Register new user
POST /auth/register
Content-Type: application/json
{
  "username": "alice",
  "password": "securepassword123"
}

# Login
POST /auth/login
{
  "username": "alice",
  "password": "securepassword123"
}
# Response: { "token": "eyJhbGc...", "username": "alice" }

# Logout (requires JWT)
POST /auth/logout
Authorization: Bearer {token}
```

### Friend Requests
```bash
# Send friend request
POST /chat/friendship/create
Authorization: Bearer {token}
{
  "receiverId": "bob-id",
  "content": "Lets be friends!"
}

# Accept friend request
PUT /chat/friendship/accept/{requestId}
Authorization: Bearer {token}

# Deny friend request
PUT /chat/friendship/deny/{requestId}
Authorization: Bearer {token}

# Get all friend requests
GET /chat/friendship
Authorization: Bearer {token}
```

### Image Upload
```bash
# Upload image
POST /chat/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data
(file: image.jpg)

# Get image
GET /chat/images/{imageName}
```

### WebSocket (Real-Time)
```bash
# Chat messaging
ws://localhost:3000/ws/chat?token={jwt_token}

# Presence (online/offline)
ws://localhost:3000/ws/presence?token={jwt_token}
```

## 🔗 Integration Examples

### Send Friend Request with Email
1. Client sends `POST /chat/friendship/create` with JWT token
2. Gateway verifies JWT, routes to chat-service
3. Chat-service:
   - Validates request via Zod schema
   - Stores in PostgreSQL
   - Emits `FRIEND_REQUEST_SENT` event
   - Publishes to RabbitMQ `emailQueue`
4. Notification-service:
   - Email Worker consumes from `emailQueue`
   - Calls email sender
   - Logs/stores delivery status

### Real-Time Messaging
1. Client connects to `ws://localhost:3000/ws/chat?token={jwt}`
2. Gateway upgrades connection (WebSocket proxy)
3. Routes to chat-service WebSocket handler
4. Messages fan out via Redis Streams
5. Recipients receive in real-time

## 📁 Project Structure

```
Real-Time-Chat-App/
├── shared/                          # Shared by all services
│   ├── errors/                      # Error handling (KnownErrors)
│   ├── events/                      # Event emitter + types
│   ├── forms/                       # Zod validation schemas
│   ├── middlewares/                 # Shared middleware (validate)
│   ├── rabbitmq/                    # RabbitMQ helpers
│   ├── types/                       # Shared TypeScript types
│   └── utils/
│
├── services/
│   ├── auth-service/
│   │   ├── src/
│   │   │   ├── controllers/         # Auth logic
│   │   │   ├── routes/              # HTTP routes
│   │   │   ├── middlewares/         # Auth middleware
│   │   │   ├── services/            # Database clients
│   │   │   ├── utils/               # Utilities
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   │
│   ├── chat-service/
│   │   ├── src/
│   │   │   ├── controllers/         # Friend requests, images
│   │   │   ├── routes/              # Chat routes
│   │   │   ├── sockets/             # WebSocket handlers
│   │   │   ├── cassandra/           # Cassandra queries
│   │   │   ├── redis/               # Redis streams
│   │   │   ├── services/            # Database clients
│   │   │   └── index.ts
│   │   ├── ...
│   │
│   ├── presence-service/
│   │   ├── src/
│   │   │   ├── sockets/             # Presence WebSocket
│   │   │   ├── services/            # Redis
│   │   │   └── index.ts
│   │
│   ├── notification-service/
│   │   ├── src/
│   │   │   ├── workers/             # Email worker
│   │   │   ├── utils/               # Email sender
│   │   │   ├── routes/
│   │   │   ├── services/            # Database clients
│   │   │   └── index.ts
│   │
│   └── gateway/
│       ├── src/
│       │   ├── middlewares/         # JWT verification
│       │   ├── websocket-proxy/     # WS upgrade handler
│       │   └── index.ts             # HTTP proxy setup
│
├── src/                             # Legacy code (reference during migration)
│   ├── cassandra/                   # To migrate to chat-service
│   ├── queue/                       # To migrate to notification-service
│   ├── redis/                       # To migrate to chat-service
│   └── sockets/                     # To migrate to services
│
├── docker-compose.yml               # Service orchestration
├── ARCHITECTURE.md                  # Architecture docs
├── FRIEND_REQUEST.md                # Friend request API docs
├── MIGRATION_GUIDE.md               # Migration patterns
├── INTEGRATION_SUMMARY.md           # Integration overview
└── CLEANUP.md                       # Cleanup guide
```

## 🔐 Security

- **JWT Authentication**: All protected routes require valid JWT token
- **Request Validation**: Zod schemas validate all inputs
- **Error Handling**: Consistent error responses via `KnownErrors` class
- **CORS**: Configured per service (can be tightened for production)
- **Environment Variables**: Sensitive data in `.env` (not committed)

## 🌐 Environment Variables

Create `.env` file in project root:

```bash
# Database
DATABASE_URL=postgresql://chat_user:chat_password@postgres:5432/chat_db
CASSANDRA_CONTACT_POINTS=cassandra
CASSANDRA_KEYSPACE=chat_keyspace

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production

# Ports (optional)
GATEWAY_PORT=3000
AUTH_SERVICE_PORT=3001
CHAT_SERVICE_PORT=3002
PRESENCE_SERVICE_PORT=3003
NOTIFICATION_SERVICE_PORT=3004

# Node environment
NODE_ENV=development
```

## 🧪 Testing

### Health Checks
```bash
# All services should respond with 200 OK
curl http://localhost:3000/health   # Gateway
curl http://localhost:3001/health   # Auth
curl http://localhost:3002/health   # Chat
curl http://localhost:3003/health   # Presence
curl http://localhost:3004/health   # Notification
```

### End-to-End Flow
See `FRIEND_REQUEST.md` for complete testing guide

### RabbitMQ Management UI
```
http://localhost:15672
Username: guest
Password: guest
```

## 📊 Databases

### PostgreSQL (Port 5432)
- **auth-service**: Users table
- **chat-service**: Groups, GroupMembers, FriendRequests, Images
- **notification-service**: OfflineMessages

### Cassandra (Port 9042)
- **chat-service**: Messages, GroupMessages (immutable, time-series)

### Redis (Port 6379)
- **Presence**: Online/offline status (key-value)
- **Cache**: User data, session info
- **Pub/Sub**: Message fan-out
- **Streams**: Chat message distribution

### RabbitMQ (Port 5672)
- **emailQueue**: Friend request email notifications
- **offlineQueue**: Offline message delivery
- **imageResizeQueue**: Image processing

## 🔄 Service Communication Patterns

### HTTP (Synchronous)
- Client → Gateway (all requests start here)
- Gateway → Auth-service (JWT verification)
- Gateway → Chat/Presence/Notification services (routing)

### RabbitMQ (Asynchronous)
- Chat-service publishes to `emailQueue` → Notification-service emailWorker consumes
- Notification-service publishes to `offlineQueue` → Offline message worker consumes
- Chat-service publishes to `imageResizeQueue` → Image worker consumes

### WebSocket
- Client → Gateway (ws://localhost:3000/ws/*)
- Gateway → Chat-service or Presence-service (WebSocket proxy)

### Redis Streams
- Chat-service publishes messages to Redis Streams
- Presence-service subscribes to user status changes
- Chat-service fans out group messages to recipients

### Events + Database
- Controllers emit events via `makeEvent()`
- EventEmitter stores in Events table automatically
- RabbitMQ integration triggered on event emission

## 🚦 Scaling Considerations

- **Horizontal Scaling**: Each service can run multiple instances behind a load balancer
- **Load Balancing**: Place nginx/HAProxy in front of gateway
- **Database Scaling**: 
  - PostgreSQL: Read replicas, connection pooling
  - Cassandra: Multi-node cluster (already distributed)
  - Redis: Sentinel or Cluster mode
- **Message Queue**: RabbitMQ can be clustered for high availability
- **Caching**: Layer cache in front of PostgreSQL queries

## 📚 Documentation

- `ARCHITECTURE.md` — System design and service boundaries
- `FRIEND_REQUEST.md` — Friend request API documentation
- `MIGRATION_GUIDE.md` — Code patterns and migration steps from monolith
- `INTEGRATION_SUMMARY.md` — Integration checklist and data flow
- `CLEANUP.md` — Monolith code cleanup guide
## 🔄 Next Migration Steps

1. **WebSocket Handlers** — Extract from monolith to services
2. **Cassandra Operations** — Move to chat-service
3. **Redis Streams** — Migrate to chat-service
4. **Offline Queue Logic** — Convert to notification-service workers
5. **Email Integration** — Replace mock with SendGrid/AWS SES
6. **Tests** — Add unit and integration tests
7. **Kubernetes** — Deploy to K8s with Helm charts

## 🛠️ Troubleshooting

### Service won't start
```bash
# Check logs
docker logs chat-auth-service

# Ensure databases are healthy
docker exec chat-postgres pg_isready
docker exec chat-redis redis-cli ping
docker exec chat-rabbitmq rabbitmq-diagnostics ping
```

### RabbitMQ connection error
```bash
# Ensure RabbitMQ is running
docker logs chat-rabbitmq

# Check connection string
echo $RABBITMQ_URL
# Should be: amqp://guest:guest@rabbitmq:5672
```

### JWT verification fails
1. Ensure token is from current session
2. Check JWT_SECRET is consistent across services
3. Verify token hasn't expired (7 day default)

## 📞 Support

For issues or questions:
1. Check logs: `docker logs <service-name>`
2. Review `ARCHITECTURE.md` for design
3. See `INTEGRATION_SUMMARY.md` for integration overview

## 📄 License

MIT License - See LICENSE file for details
