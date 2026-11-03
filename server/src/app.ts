import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { router } from './routes/index.js';
import { csrfProtection } from './middleware/csrf.js';
import { apiLimiter } from './middleware/rateLimiters.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  if (env.TRUST_PROXY) app.set('trust proxy', env.TRUST_PROXY);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, cb) {
        // Allow same-origin / server-to-server requests (no Origin) and configured client origins only.
        if (!origin || env.CLIENT_ORIGINS.includes(origin)) return cb(null, true);
        return cb(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
      maxAge: 600,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '200kb' }));
  app.use(cookieParser());
  if (!env.isTest) {
    app.use(
      pinoHttp({
        logger,
        // Log method, path and status only — no bodies or query strings with personal data.
        serializers: {
          req: (req) => ({ method: req.method, url: String(req.url).split('?')[0] }),
          res: (res) => ({ statusCode: res.statusCode }),
        },
        autoLogging: { ignore: (req) => req.url === '/health' },
      }),
    );
  }

  app.get('/health', (_req, res) => {
    const dbUp = mongoose.connection.readyState === 1;
    res.status(dbUp ? 200 : 503).json({ status: dbUp ? 'ok' : 'degraded', database: dbUp ? 'connected' : 'disconnected' });
  });

  app.use('/api/v1', apiLimiter, csrfProtection, router);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
