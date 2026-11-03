import { afterAll, afterEach, beforeAll, inject } from 'vitest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { createApp } from '../app.js';
import { User } from '../models/User.js';
import { Scheme } from '../models/Scheme.js';
import { SavedScheme } from '../models/SavedScheme.js';
import { Application } from '../models/Application.js';
import { ChecklistProgress } from '../models/ChecklistProgress.js';

export const app = createApp();

/** Connects to the shared in-memory MongoDB using a database unique to the test file. */
export function useTestDatabase(name: string) {
  beforeAll(async () => {
    await mongoose.connect(inject('mongoUri'), { dbName: `test_${name}` });
    await Promise.all([User.syncIndexes(), Scheme.syncIndexes(), SavedScheme.syncIndexes(), Application.syncIndexes(), ChecklistProgress.syncIndexes()]);
  });
  afterEach(async () => {
    const collections = await mongoose.connection.db!.collections();
    await Promise.all(collections.map((c) => c.deleteMany({})));
  });
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });
}

export interface TestClient {
  agent: ReturnType<typeof request.agent>;
  csrf: string;
  get: (url: string) => request.Test;
  post: (url: string, body?: object) => request.Test;
  put: (url: string, body?: object) => request.Test;
  patch: (url: string, body?: object) => request.Test;
  del: (url: string, body?: object) => request.Test;
}

/** A cookie-keeping client that sends the CSRF header on state-changing requests. */
export async function newClient(): Promise<TestClient> {
  const agent = request.agent(app);
  const res = await agent.get('/api/v1/auth/csrf');
  const csrf = res.body.data.csrfToken as string;
  return {
    agent,
    csrf,
    get: (url) => agent.get(url),
    post: (url, body) => agent.post(url).set('X-CSRF-Token', csrf).send(body ?? {}),
    put: (url, body) => agent.put(url).set('X-CSRF-Token', csrf).send(body ?? {}),
    patch: (url, body) => agent.patch(url).set('X-CSRF-Token', csrf).send(body ?? {}),
    del: (url, body) => agent.delete(url).set('X-CSRF-Token', csrf).send(body ?? {}),
  };
}

let counter = 0;
export async function registeredClient(overrides: Partial<{ name: string; email: string; password: string }> = {}) {
  const client = await newClient();
  const creds = { name: 'Test User', email: `user${++counter}@example.com`, password: 'password123', ...overrides };
  const res = await client.post('/api/v1/auth/register', creds);
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { client, creds, user: res.body.data.user as { id: string } };
}

export async function adminClient() {
  const email = `admin${++counter}@example.com`;
  await User.create({ name: 'Admin', email, passwordHash: await bcrypt.hash('adminpass123', 4), role: 'admin' });
  const client = await newClient();
  const res = await client.post('/api/v1/auth/login', { email, password: 'adminpass123' });
  if (res.status !== 200) throw new Error('admin login failed');
  return client;
}

export function validSchemeInput(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Test Scholarship for Undergraduates',
    shortDescription: 'A test scholarship used in automated tests.',
    description: 'A longer description of the test scholarship used in automated tests only.',
    category: 'education',
    provider: 'Test Provider',
    providerType: 'central_government',
    isAllIndia: true,
    benefitType: 'scholarship',
    benefitSummary: 'Test benefit',
    officialSourceUrl: 'https://example.org/test',
    eligibilityRules: {
      op: 'all',
      conditions: [
        { field: 'annualIncome', operator: 'lessThanOrEqual', value: 250000 },
        { field: 'educationLevel', operator: 'in', value: ['undergraduate'] },
      ],
    },
    requiredDocuments: [
      { docId: 'id-proof', name: 'Identity proof' },
      { docId: 'income-cert', name: 'Income certificate' },
    ],
    publicationStatus: 'published',
    ...overrides,
  };
}

/** Inserts a published scheme directly (bypassing the API). */
export async function insertScheme(overrides: Record<string, unknown> = {}) {
  const input = validSchemeInput(overrides);
  return Scheme.create({ slug: `test-${++counter}`, ...input });
}
