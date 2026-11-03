import 'dotenv/config';
import { z } from 'zod';

const boolish = z
  .union([z.boolean(), z.string()])
  .transform((v) => (typeof v === 'boolean' ? v : ['true', '1', 'yes'].includes(v.toLowerCase())));

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().optional(),
  MONGODB_DB_NAME: z.string().default('schemesetu'),
  USE_EMBEDDED_MONGO: boolish.default(false),
  JWT_ACCESS_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  COOKIE_SECURE: boolish.optional(),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  GEMINI_API_KEY: z.string().optional(),
  // gemini-2.5-flash is no longer available to new API keys (404 for keys created in 2026).
  GEMINI_MODEL: z.string().default('gemini-3.5-flash'),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  // Tokens the model may spend "thinking". The explainer only restates supplied facts, so 0 keeps
  // answers fast and stops thinking from using up the output limit. Use -1 for the model default.
  AI_THINKING_BUDGET: z.coerce.number().int().min(-1).default(0),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).optional(),
  RATE_LIMIT_ENABLED: boolish.default(true),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}
const raw = parsed.data;
const isProd = raw.NODE_ENV === 'production';

function requireSecret(name: 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET'): string {
  const value = raw[name];
  if (value && value.length >= 32) return value;
  if (isProd) {
    // eslint-disable-next-line no-console
    console.error(`${name} must be set to a random string of at least 32 characters in production.`);
    process.exit(1);
  }
  // Development/test only: a fixed, clearly non-secret fallback so the app starts out of the box.
  return `dev-only-insecure-${name.toLowerCase()}-change-me-000000`;
}

export const env = {
  ...raw,
  isProd,
  isTest: raw.NODE_ENV === 'test',
  JWT_ACCESS_SECRET: requireSecret('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: requireSecret('JWT_REFRESH_SECRET'),
  CLIENT_ORIGINS: raw.CLIENT_URL.split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean),
  COOKIE_SECURE: raw.COOKIE_SECURE ?? (isProd || raw.COOKIE_SAMESITE === 'none'),
  LOG_LEVEL: raw.LOG_LEVEL ?? (raw.NODE_ENV === 'test' ? 'silent' : isProd ? 'info' : 'debug'),
  aiEnabled: Boolean(raw.GEMINI_API_KEY && raw.GEMINI_API_KEY.trim()),
};
