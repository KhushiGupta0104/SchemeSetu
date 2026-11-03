import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  // Never log credentials, cookies, tokens or request bodies (which may contain profile data).
  redact: {
    paths: [
      'req.headers.cookie',
      'req.headers.authorization',
      'req.headers["x-csrf-token"]',
      'res.headers["set-cookie"]',
      '*.password',
      '*.passwordHash',
    ],
    censor: '[redacted]',
  },
  ...(env.isProd || env.isTest
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
        },
      }),
});
