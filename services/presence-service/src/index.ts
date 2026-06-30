import express from 'express';
import { handleError } from '../../shared/errors';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'presence' }));

// TODO: Add WebSocket handling for presence tracking
// - Online/offline status
// - Heartbeat ping-pong

// Error handler middleware (must be last)
app.use(handleError);

const port = process.env.PORT || 3003;
app.listen(port, () => console.log(`presence-service listening on ${port}`));
