import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, newClient, registeredClient, useTestDatabase } from './helpers.js';
import { User } from '../models/User.js';

useTestDatabase('auth');

describe('authentication', () => {
  it('registers a user, sets HttpOnly cookies and never returns the password hash', async () => {
    const client = await newClient();
    const res = await client.post('/api/v1/auth/register', { name: 'Asha', email: 'Asha@Example.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.data.user).toMatchObject({ name: 'Asha', email: 'asha@example.com', role: 'user' });
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|\$2[aby]\$/);
    const cookies = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
    expect(cookies.some((c) => c.startsWith('ss_at=') && /HttpOnly/i.test(c))).toBe(true);
    expect(cookies.some((c) => c.startsWith('ss_rt=') && /HttpOnly/i.test(c))).toBe(true);
    const stored = await User.findOne({ email: 'asha@example.com' }).select('+passwordHash');
    expect(stored?.passwordHash).not.toBe('password123');
  });

  it('rejects duplicate emails with 409', async () => {
    await registeredClient({ email: 'dup@example.com' });
    const client = await newClient();
    const res = await client.post('/api/v1/auth/register', { name: 'Again', email: 'dup@example.com', password: 'password123' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('validates registration input', async () => {
    const client = await newClient();
    const res = await client.post('/api/v1/auth/register', { name: 'A', email: 'not-an-email', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const paths = res.body.error.details.map((d: { path: string }) => d.path);
    expect(paths).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });

  it('never lets users assign themselves the admin role', async () => {
    const client = await newClient();
    const res = await client.post('/api/v1/auth/register', { name: 'Mallory', email: 'm@example.com', password: 'password123', role: 'admin' });
    expect(res.status).toBe(400);
    expect(await User.exists({ email: 'm@example.com' })).toBeNull();
  });

  it('logs in with correct credentials and rejects wrong ones with a generic message', async () => {
    await registeredClient({ email: 'login@example.com', password: 'password123' });
    const client = await newClient();
    const bad = await client.post('/api/v1/auth/login', { email: 'login@example.com', password: 'wrongpass1' });
    expect(bad.status).toBe(401);
    expect(bad.body.error.message).toBe('Incorrect email or password.');
    const unknown = await client.post('/api/v1/auth/login', { email: 'nobody@example.com', password: 'wrongpass1' });
    expect(unknown.body.error.message).toBe('Incorrect email or password.');
    const good = await client.post('/api/v1/auth/login', { email: 'login@example.com', password: 'password123' });
    expect(good.status).toBe(200);
    const me = await client.get('/api/v1/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe('login@example.com');
  });

  it('protects routes from unauthenticated access', async () => {
    for (const url of ['/api/v1/auth/me', '/api/v1/profile', '/api/v1/saved', '/api/v1/applications', '/api/v1/recommendations', '/api/v1/dashboard']) {
      const res = await request(app).get(url);
      expect(res.status, url).toBe(401);
    }
  });

  it('rejects state-changing requests without a valid CSRF token', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'a@b.com', password: 'x' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CSRF_INVALID');
    const client = await newClient();
    const wrong = await client.agent.post('/api/v1/auth/login').set('X-CSRF-Token', 'f'.repeat(64)).send({ email: 'a@b.com', password: 'x' });
    expect(wrong.status).toBe(403);
  });

  it('logs out, clears cookies and revokes the refresh token', async () => {
    const { client } = await registeredClient();
    const out = await client.post('/api/v1/auth/logout');
    expect(out.status).toBe(200);
    expect((await client.get('/api/v1/auth/me')).status).toBe(401);
    expect((await client.post('/api/v1/auth/refresh')).status).toBe(401);
  });

  it('refreshes the session using the refresh cookie', async () => {
    const { client } = await registeredClient();
    const res = await client.post('/api/v1/auth/refresh');
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('user');
  });

  it('rejects tampered access tokens', async () => {
    const res = await request(app).get('/api/v1/auth/me').set('Cookie', 'ss_at=eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIiwicm9sZSI6ImFkbWluIn0.');
    expect(res.status).toBe(401);
  });

  it('deletes the account and associated data after password confirmation', async () => {
    const { client, creds } = await registeredClient();
    expect((await client.del('/api/v1/auth/account', { password: 'wrong-pass1' })).status).toBe(400);
    expect((await client.del('/api/v1/auth/account', { password: creds.password })).status).toBe(200);
    expect(await User.exists({ email: creds.email })).toBeNull();
  });
});

describe('profile', () => {
  it('saves, merges and clears profile fields', async () => {
    const { client } = await registeredClient();
    const save = await client.put('/api/v1/profile', {
      profile: { state: 'Karnataka', educationLevel: 'undergraduate', incomeBracket: '1l_2l', gender: 'prefer_not_to_say' },
      completeOnboarding: true,
    });
    expect(save.status).toBe(200);
    expect(save.body.data.onboardingCompleted).toBe(true);
    expect(save.body.data.profile).toMatchObject({ state: 'Karnataka', incomeBracket: '1l_2l' });

    const merge = await client.put('/api/v1/profile', { profile: { age: 20, state: null } });
    expect(merge.body.data.profile.state).toBeUndefined();
    expect(merge.body.data.profile.educationLevel).toBe('undergraduate');

    const get = await client.get('/api/v1/profile');
    expect(get.body.data.profile.age).toBe(20);
    expect(get.body.data.completion.total).toBeGreaterThan(0);
  });

  it('rejects invalid values and sensitive identifiers', async () => {
    const { client } = await registeredClient();
    expect((await client.put('/api/v1/profile', { profile: { state: 'Atlantis' } })).status).toBe(400);
    expect((await client.put('/api/v1/profile', { profile: { aadhaarNumber: '123412341234' } })).status).toBe(400);
    expect((await client.put('/api/v1/profile', { profile: { previousExamPercentage: 140 } })).status).toBe(400);
  });

  it('rejects an exact income outside the chosen bracket', async () => {
    const { client } = await registeredClient();
    const res = await client.put('/api/v1/profile', { profile: { incomeBracket: 'upto_1l', annualIncome: 500000 } });
    expect(res.status).toBe(400);
  });
});
