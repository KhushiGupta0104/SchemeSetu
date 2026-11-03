/**
 * Starts an isolated API for Playwright end-to-end tests: ephemeral in-memory MongoDB,
 * seeded with real + demo schemes, one admin and one demo student. Never used in production.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';

process.env.NODE_ENV = 'development';
process.env.RATE_LIMIT_ENABLED = 'false';
process.env.LOG_LEVEL = 'warn';
process.env.CLIENT_URL = 'http://localhost:5174';

const PORT = Number(process.env.E2E_API_PORT ?? 5100);

async function main() {
  // Keep the throwaway database inside the repo (gitignored), not in the system temp dir.
  const dataDir = path.resolve(process.cwd(), 'server/.data');
  // Remove leftovers from runs that were killed without a shutdown signal (common on Windows).
  if (fs.existsSync(dataDir)) for (const d of fs.readdirSync(dataDir)) if (d.startsWith('e2e-')) fs.rmSync(path.join(dataDir, d), { recursive: true, force: true });
  const dbPath = path.join(dataDir, 'e2e-' + Date.now());
  fs.mkdirSync(dbPath, { recursive: true });
  const mongo = await MongoMemoryServer.create({ instance: { dbPath } });
  const { createApp } = await import('../app.js');
  const { seedSchemes } = await import('../seed/seed.js');
  const { realSchemes } = await import('../seed/data/realSchemes.js');
  const { buildDemoSchemes, DEMO_STUDENT } = await import('../seed/data/demoSchemes.js');
  const { User } = await import('../models/User.js');

  await mongoose.connect(mongo.getUri(), { dbName: 'schemesetu_e2e' });
  await seedSchemes(realSchemes, false);
  await seedSchemes(buildDemoSchemes(), true);
  await User.create({ name: 'E2E Admin', email: 'admin@e2e.test', passwordHash: await bcrypt.hash('AdminPass12345', 10), role: 'admin', onboardingCompletedAt: new Date() });
  await User.create({ ...DEMO_STUDENT, email: 'student@e2e.test', passwordHash: await bcrypt.hash('StudentPass123', 10), role: 'user', onboardingCompletedAt: new Date() });

  createApp().listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`E2E API ready on http://localhost:${PORT}`);
  });
  const stop = async () => {
    await mongoose.disconnect();
    await mongo.stop();
    fs.rmSync(dbPath, { recursive: true, force: true });
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
