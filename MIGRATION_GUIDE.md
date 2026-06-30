# Code Migration Guide: Old Monolith → New Microservices

This document outlines which old code patterns should be replaced with new ones as you migrate functions from the monolith to microservices.

## ✅ Already Updated in New Services

### Error Handling
**Old Pattern (monolith):**
```typescript
res.status(409).json({ error: "Username already exists" });
res.status(500).json({ error: "Internal server error" });
```

**New Pattern (shared):**
```typescript
import { KnownErrors } from '../../shared/errors';
throw new KnownErrors('ERR_INVALID_REQUEST', { detail: 'Username already exists' });
```
**Location:** `shared/errors/index.ts`
**Services Updated:** auth-service, chat-service, gateway

---

### Validation
**Old Pattern (monolith):**
```typescript
export const validateLogin = (req, res, next) => {
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }
  next();
};
app.post('/login', validateLogin, handler);
```

**New Pattern (shared):**
```typescript
import validate from '../../shared/middlewares/validate';
import { loginForm } from '../../shared/forms';

router.post('/login', validate(loginForm), AuthController.login);
```
**Location:** `shared/forms/index.ts`, `shared/middlewares/validate.ts`
**Services Updated:** auth-service

---

### Events
**Old Pattern (monolith):**
```typescript
// Manually store events or emit locally
// No cross-service event handling
```

**New Pattern (shared):**
```typescript
import { makeEvent } from '../../shared/events';
import { EVENTS } from '../../shared/events/type';

const event = makeEvent(prisma);
event.emit(EVENTS.FRIEND_REQUEST_SENT, friendsRequest);
```
**Location:** `shared/events/index.ts`, `shared/events/type.ts`
**Services Updated:** chat-service (friend requests, image uploads)

---

### RabbitMQ
**Old Pattern (monolith):**
```typescript
// Direct RabbitMQ calls scattered in code
const connection = await amqp.connect('amqp://localhost');
const channel = await connection.createChannel();
await channel.assertQueue(queueName);
await channel.sendToQueue(queueName, Buffer.from(...));
```

**New Pattern (shared):**
```typescript
import connectToRabbitMQ from '../../shared/rabbitmq/rabbitmq';
import { sendMessageToEmailQueue, sendMessageToImageQueue } from '../../shared/rabbitmq/queues';

const connection = await connectToRabbitMQ();
const channel = await connection.createChannel();
await sendMessageToEmailQueue(channel, 'emailQueue', senderId, receiverId, content);
```
**Location:** `shared/rabbitmq/rabbitmq.ts`, `shared/rabbitmq/queues.ts`
**Services Updated:** chat-service (image upload, friend requests)

---

## 🔄 Still Need Migration (Monolith → Services)

### WebSocket Handlers
**Location (old):** `src/sockets/chatHandler.ts`, `src/sockets/presenceHandler.ts`
**Target Location:** 
- `services/chat-service/src/sockets/` → chat messaging
- `services/presence-service/src/sockets/` → online/offline tracking
**Status:** TODO — Extract and wire into services

---

### Cassandra Operations
**Location (old):** `src/cassandra/*.ts`
**Target Location:** `services/chat-service/src/cassandra/`
**Status:** TODO — Copy as-is, may need environment config updates

---

### Redis Streams (Chat fan-out)
**Location (old):** `src/redis/chatMessagesStreams.ts`, `src/redis/chatSubscriber.ts`
**Target Location:** `services/chat-service/src/redis/`
**Status:** TODO — Integrate with new error/event patterns

---

### Offline Queue & Workers
**Location (old):** `src/queue/offlineQueue.ts`, `src/queue/offlineWorker.ts`
**Target Location:** `services/notification-service/src/workers/`
**Status:** TODO — Consume RabbitMQ events instead of in-process queue

---

### Socket Handlers (Connection Management)
**Location (old):** `src/sockets/handlers/*`
**Target Location:** 
- `services/chat-service/src/sockets/` → if chat-related
- `services/presence-service/src/sockets/` → if presence-related
**Status:** TODO — Migrate based on responsibility

---

## 📋 Patterns NOT Needing Migration (Keep in Monolith for Now)

- `src/utils/logger.ts` — Can stay in monolith, each service can have own logger
- `src/utils/startup.ts` — Specific to monolith orchestration
- `src/mockData.ts` — Test data, migrate to seed scripts per service if needed
- `src/routes/index.ts` (old monolith routes) — Being replaced by service-specific routes

---

## 🚀 Services & Their Code Sources

| Service | HTTP Port | WS Port | Code From | Primary DB | Secondary DB |
|---------|-----------|---------|-----------|------------|--------------|
| auth-service | 3001 | N/A | `src/controllers/authContoroller.ts` | PostgreSQL (Users) | Redis (cache) |
| chat-service | 3002 | 4000 | `src/sockets/chatHandler.ts` | PostgreSQL (Groups) | Cassandra (Messages) |
| presence-service | 3003 | 5000 | `src/sockets/presenceHandler.ts` | Redis only | N/A |
| notification-service | 3004 | N/A | `src/queue/offlineWorker.ts` | PostgreSQL (OfflineMessages) | RabbitMQ |
| gateway | 3000 | N/A | New (routing only) | N/A | N/A |

---

## 📝 Next Steps

1. ✅ Extract auth code → done
2. ✅ Add error handling → done
3. ✅ Add events system → done
4. ✅ Add validation forms → done
5. ✅ Wire gateway → done
6. ⏳ Extract WebSocket handlers → chat-service & presence-service
7. ⏳ Extract Cassandra ops → chat-service
8. ⏳ Extract Cassandra ops → chat-service
9. ⏳ Extract offline queue logic → notification-service workers
10. ⏳ Update Prisma schemas per service
11. ⏳ Test all services with docker-compose
