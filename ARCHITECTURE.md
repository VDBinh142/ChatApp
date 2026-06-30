# Microservices Architecture - Code Organization

## Shared Folder Structure (Used by all services)
```
shared/
├── errors/
│   └── index.ts           # KnownErrors class + error mapping
├── events/
│   ├── index.ts           # Event emitter factory
│   └── type.ts            # Event constants
├── forms/
│   └── index.ts           # Zod validation schemas
├── middlewares/
│   └── validate.ts        # Zod validation middleware
├── rabbitmq/
│   ├── rabbitmq.ts        # RabbitMQ connection
│   └── queues.ts          # Queue producers/consumers
├── types/
│   ├── events.ts          # Event type definitions
│   └── express.d.ts       # Express augmentation (userId, token)
└── utils/
    └── README.md
```

## Service-Specific Code (Do NOT share between services)
- `services/{service}/src/controllers/` — Business logic
- `services/{service}/src/routes/` — API route definitions
- `services/{service}/src/services/` — Database clients (Prisma, Redis)
- `services/{service}/src/sockets/` — WebSocket handlers (chat, presence)
- `services/{service}/src/middlewares/` — Service-specific auth middleware
- `services/{service}/src/workers/` — Background job workers

## Pattern Updates (Old → New)
| Old Code | New Pattern | Location |
|----------|-------------|----------|
| `res.status(400).json({error: ...})` | `throw new KnownErrors('ERR_*')` | in controllers, shared errors will handle it |
| Manual validation in middleware | Zod schemas via `validate()` middleware | `shared/forms/` + `shared/middlewares/validate.ts` |
| `AppError` class | `KnownErrors` class | `shared/errors/` |
| Manual event storage | `makeEvent()` factory + EventEmitter | `shared/events/` |
| Direct RabbitMQ calls | Helper fns from `shared/rabbitmq/` | `shared/rabbitmq/queues.ts` |

## Services to Deploy
1. **auth-service** (port 3001) — User registration, login, JWT, profile
2. **chat-service** (port 3002) — WebSocket messaging, groups, friends, image upload
3. **presence-service** (port 3003) — Online/offline status, heartbeat
4. **notification-service** (port 3004) — Offline message delivery, event consumers
5. **gateway** (port 3000) — JWT verification, routing, WebSocket upgrade

## Database Ownership
- **PostgreSQL (shared)**: auth-service owns Users table, chat-service owns Groups/GroupMembership/FriendRequests/Images
- **Cassandra (chat-service)**: Messages, GroupMessages
- **Redis (shared)**: Presence keys, connection routing, pub/sub
- **RabbitMQ (shared)**: Cross-service event distribution
