import express from 'express';
import authRoutes from './routes/authRoutes';
import { handleError } from '../../../shared/errors';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'auth' }));

// Error handler middleware (must be last)
app.use(handleError);

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`auth-service listening on ${port}`));
