import express from 'express';
import notificationRoutes from './routes/notificationRoutes';
import { handleError } from '../../shared/errors';
import { startEmailWorker } from './workers/emailWorker';

const app = express();
app.use(express.json());

app.use('/notification', notificationRoutes);
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'notification' }));

// Error handler middleware (must be last)
app.use(handleError);

const port = process.env.PORT || 3004;
const server = app.listen(port, () => {
  console.log(`🚀 Notification service listening on port ${port}`);
  
  // Start email worker
  startEmailWorker().catch((error) => {
    console.error('Failed to start email worker:', error);
    process.exit(1);
  });
});
