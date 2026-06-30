# Friend Request System with Email Notifications

## Overview

This document describes the friend request system integrated into the microservices architecture with automatic email notifications via RabbitMQ.

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP POST /chat/friendship/create
       ├─────────────────────────────────►
       ├─ JWT Token
       └─ { receiverId, content? }
       
       ▼
┌─────────────────────────────────────┐
│  Gateway (3000)                     │
│  - Verifies JWT                     │
│  - Routes to chat-service           │
└────────┬────────────────────────────┘
       │ Forward request
       ▼
┌─────────────────────────────────────┐
│  Chat Service (3002)                │
│  ┌────────────────────────────────┐ │
│  │ RelationshipController:        │ │
│  │ - Create friend request        │ │
│  │ - Verify receiver exists       │ │
│  │ - Store in Prisma PostgreSQL   │ │
│  └────────┬───────────────────────┘ │
│           │                         │
│  ┌────────▼───────────────────────┐ │ 1️⃣ Emit event
│  │ Event Emitter                  │ │
│  │ - Emit FRIEND_REQUEST_SENT     │──► Store in Events table
│  │ - Emit to EventEmitter         │
│  └────────┬───────────────────────┘ │
│           │                         │
│  ┌────────▼───────────────────────┐ │ 2️⃣ Send to RabbitMQ
│  │ RabbitMQ Integration           │ │
│  │ - Send to emailQueue           │──► amqp://queue/emailQueue
│  │ - { senderId, receiverId, ... }│ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
       │
       │ RabbitMQ message
       ▼
┌─────────────────────────────────────┐
│  Notification Service (3004)        │
│  ┌────────────────────────────────┐ │
│  │ Email Worker                   │ │
│  │ - Consume from emailQueue      │──► Sends email
│  │ - Call sendEmailNotification() │
│  │ - Store delivery status        │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## API Endpoints

### Send Friend Request
```http
POST /chat/friendship/create
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "receiverId": "user-123",
  "content": "Let's be friends!"
}
```

**Response:**
```json
{
  "id": "req-456",
  "senderId": "user-789",
  "receiverId": "user-123",
  "content": "Let's be friends!",
  "status": "pending",
  "createdAt": "2024-06-30T10:00:00Z"
}
```

### Accept Friend Request
```http
PUT /chat/friendship/accept/{requestId}
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "id": "req-456",
  "senderId": "user-789",
  "receiverId": "user-123",
  "acceptedAt": "2024-06-30T10:05:00Z"
}
```

### Deny Friend Request
```http
PUT /chat/friendship/deny/{requestId}
Authorization: Bearer {jwt_token}
```

or

```http
PUT /chat/friendship/reject/{requestId}
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "id": "req-456",
  "senderId": "user-789",
  "receiverId": "user-123",
  "rejectedAt": "2024-06-30T10:05:00Z"
}
```

### Get Friend Requests
```http
GET /chat/friendship
Authorization: Bearer {jwt_token}
```

**Response:**
```json
[
  {
    "id": "req-456",
    "senderId": "user-789",
    "receiverId": "user-123",
    "content": "Let's be friends!",
    "status": "pending",
    "sender": { "id": "user-789", "username": "alice" },
    "receiver": { "id": "user-123", "username": "bob" }
  }
]
```

## Code Location

### Controllers
- `services/chat-service/src/controllers/RelationshipController.ts`
  - `SendFriendRequest()` — Creates friend request, emits event, sends to RabbitMQ
  - `AcceptFriendRequest()` — Updates friend request status
  - `RejectFriendRequest()` — Rejects friend request
  - `GetFriendsRequest()` — Fetches all friend requests for user

### Routes
- `services/chat-service/src/routes/chatRoutes.ts`
  - Wires friend request endpoints with JWT verification

### Events
- `shared/events/type.ts`
  - `FRIEND_REQUEST_SENT` — Emitted when request is created
  - `FRIEND_REQUEST_ACCEPTED` — Emitted when request is accepted
  - `FRIEND_REQUEST_DECLINED` — Emitted when request is rejected

### RabbitMQ Integration
- `shared/rabbitmq/queues.ts`
  - `sendMessageToEmailQueue()` — Sends email notification to queue

- `services/notification-service/src/workers/emailWorker.ts`
  - Consumes from `emailQueue`
  - Calls `sendEmailNotification()`
  - Stores delivery status in database

### Form Validation
- `shared/forms/index.ts`
  - `friendRequestForm` — Zod schema for validation
  - Validates `receiverId` and optional `content`

## Event Flow

1. **Client sends friend request** → Gateway → Chat Service
2. **Chat Service:**
   - Validates JWT and friend request data
   - Creates friend request in PostgreSQL
   - Emits `FRIEND_REQUEST_SENT` event
   - Publishes to RabbitMQ `emailQueue`
3. **Event/Database:**
   - Event is stored in Events table (for audit trail)
4. **Notification Service:**
   - Email Worker listens to `emailQueue`
   - Consumes message and sends email
   - Stores delivery status in database
5. **Client receives response** ← Chat Service

## Environment Variables

```bash
# Notification Service
DATABASE_URL=postgresql://chat_user:chat_password@postgres:5432/chat_db
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
JWT_SECRET=chat_jwt_secret_key_change_in_prod
```

## Future Enhancements

- Integrate with actual email provider (SendGrid, AWS SES, etc.)
- Add email templates for different request types
- Add retry logic for failed email sends
- Add webhook notifications for real-time updates
- Add friend request expiration (auto-reject after 30 days)
- Add rate limiting on friend requests

## Testing

```bash
# 1. Start all services
docker-compose up

# 2. Register two users
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "password123"}'

curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "bob", "password": "password123"}'

# 3. Login to get JWT token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "password123"}' | jq -r '.token')

# 4. Send friend request
curl -X POST http://localhost:3000/chat/friendship/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"receiverId": "user-bob-id", "content": "Lets be friends"}'

# 5. Check email worker logs
docker logs chat-notification-service | grep "Email Worker"
```
