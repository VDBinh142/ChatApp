import http from 'http';
import express from 'express';
import { createChatRoutes } from './routes/chatRoutes';
import { prisma } from './services/prisma';
import { handleError } from '../../../shared/errors';

const app = express();
app.use(express.json());

// Chat routes
app.use('/chat', createChatRoutes(prisma));

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'chat' }));

// Error handler middleware (must be last)
app.use(handleError);

const server = http.createServer(app);
const port = process.env.PORT || 3002;
server.listen(port, () => console.log(`chat-service listening on ${port}`));
