import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import apiRouter from './routes/api.js';
import { storeSession } from './middleware/storeSession.js';
import type { StateRepository } from './repositories/stateRepository.js';

export function createApp(repository: StateRepository) {
  const app = express();

  // 1. Production security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Vite SPA embedded assets without blocking scripts
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. CORS configuration for Vercel, localhost, and custom frontend URLs
  const customOrigins = (process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_URL || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ];

  const allowedOrigins = [...defaultOrigins, ...customOrigins];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.includes(origin) ||
          origin.endsWith('.vercel.app') ||
          origin.includes('localhost') ||
          origin.includes('127.0.0.1')
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-forwarded-for', 'x-enforce-auth'],
    })
  );

  // 3. Body parsing with reasonable payload limits
  app.use(express.json({ limit: '10mb' }));

  // 4. Rate limiting for auth and sensitive APIs (disabled during test runs)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 200, // 200 requests per window
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { success: false, error: 'Too many authentication attempts. Please try again later.' },
    skip: () => process.env.NODE_ENV === 'test',
  });
  app.use('/api/auth/login', authLimiter);

  // 5. Database session middleware for transactional store access
  app.use('/api', storeSession(repository));

  // 6. Public status endpoint
  app.get('/api/database/status', (_req, res) => {
    res.json({ success: true, data: { mode: repository.mode, persistent: repository.mode === 'supabase' } });
  });

  // 7. Core REST API routes
  app.use('/api', apiRouter);

  // 8. Safe global error handler (no stack trace leaks in production)
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const status = typeof err?.status === 'number' ? err.status : 500;
    const message = isProduction && status === 500
      ? 'An unexpected server error occurred.'
      : err?.message || 'Server error';

    res.status(status).json({ success: false, error: message });
  });

  return app;
}

