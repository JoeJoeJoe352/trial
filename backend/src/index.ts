import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './auth/routes';
import adminRoutes from './admin';
import categoriesRoutes from './categories/routes';
import subscriptionsRoutes from './me/subscriptions.routes';
import newsRoutes from './news/routes';
import { startScheduler } from './ingestion/scheduler';
import { startMatcher } from './matching/matcher';
import { startEmailDigestScheduler } from './notifications/email-digest';

const app = express();
const port = process.env.PORT ?? 3000;

app.use(cors({ origin: process.env.CORS_ORIGIN ?? true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/hello', (_req, res) => {
  res.json({ message: 'Hello World' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/me/subscriptions', subscriptionsRoutes);
app.use('/api/news', newsRoutes);

app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

/** Catch-all error handler: logs the error and returns a generic 500 so internals never leak to clients. */
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

startMatcher();
startEmailDigestScheduler();

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
  startScheduler().catch((err) => console.error('Failed to start scheduler:', err));
});
