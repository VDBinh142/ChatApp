# Cleanup Script - Remove Unused Monolith Code

This script identifies files that have been replaced by the microservices architecture.

## Files to DELETE (Safely Deleted - Already Migrated to Services/Shared)

```bash
# Old HTTP server entry point
rm src/index.ts

# Old HTTP server (replaced by service-specific servers)
rm src/server/http.ts

# Old routing layer (replaced by service-specific routes)
rm -rf src/routes/

# Old auth controller (moved to auth-service)
rm src/controllers/authContoroller.ts

# Old validation middleware (moved to shared/forms + shared/middlewares/validate)
rm src/middlewares/validation.ts

# Old error handler (moved to shared/errors)
rm src/middlewares/errorHandler.ts

# Old CORS middleware (can be added per-service if needed)
rm src/middlewares/cors.ts

# Old auth middleware (replaced by service-specific versions)
rm src/middlewares/auth.ts

# Old test/mock data
rm src/mockData.ts
```

## Files to KEEP (Will Be Migrated to Services Later)

- `src/cassandra/` → Will move to `services/chat-service/src/cassandra/`
- `src/queue/` → Will move to `services/notification-service/src/queue/` or `src/workers/`
- `src/redis/` → Will move to `services/chat-service/src/redis/`
- `src/sockets/` → Will split to `chat-service/src/sockets/` and `presence-service/src/sockets/`
- `src/services/` → Will split to service-specific locations
- `src/types/` → Useful for WebSocket handling, keep as reference
- `src/utils/` → Some utilities will be migrated, others are monolith-specific

## Current Status

After microservices extraction, the old `src/` folder is only used as a reference for code to migrate into individual services.
It should NOT be running the application anymore.
