import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, insertScheme, registeredClient, useTestDatabase } from './helpers.js';
import { addDays, todayIST } from '../utils/dates.js';

useTestDatabase('schemes');

describe('public scheme explorer', () => {
  it('lists only published schemes, with pagination meta', async () => {
    await insertScheme({ name: 'Alpha Scholarship' });
    await insertScheme({ name: 'Beta Scholarship' });
    await insertScheme({ name: 'Hidden Draft Scheme', publicationStatus: 'draft' });
    const res = await request(app).get('/api/v1/schemes?limit=1&sort=name');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Alpha Scholarship');
    expect(res.body.meta).toMatchObject({ page: 1, limit: 1, total: 2, totalPages: 2, personalised: false });
    expect(res.body.data[0].eligibility).toBeNull();
  });

  it('searches by name, provider and keywords (regex-safe)', async () => {
    await insertScheme({ name: 'Girls Technical Scholarship', provider: 'AICTE', tags: ['engineering'] });
    await insertScheme({ name: 'Farmer Income Support', provider: 'Agriculture Ministry' });
    expect((await request(app).get('/api/v1/schemes?q=technical')).body.data).toHaveLength(1);
    expect((await request(app).get('/api/v1/schemes?q=aicte')).body.data).toHaveLength(1);
    expect((await request(app).get('/api/v1/schemes?q=engineering')).body.data).toHaveLength(1);
    expect((await request(app).get('/api/v1/schemes?q=.*')).body.data).toHaveLength(0);
  });

  it('filters by category, state applicability and deadline availability', async () => {
    await insertScheme({ name: 'All India Edu', category: 'education' });
    await insertScheme({ name: 'Bengal Only', category: 'women_empowerment', isAllIndia: false, applicableStates: ['West Bengal'] });
    await insertScheme({ name: 'With Deadline', applicationDeadline: addDays(todayIST(), 10) });
    expect((await request(app).get('/api/v1/schemes?category=women_empowerment')).body.data.map((s: { name: string }) => s.name)).toEqual(['Bengal Only']);
    const kerala = (await request(app).get('/api/v1/schemes?state=Kerala')).body.data.map((s: { name: string }) => s.name);
    expect(kerala).not.toContain('Bengal Only');
    expect((await request(app).get('/api/v1/schemes?state=West%20Bengal')).body.data).toHaveLength(3);
    expect((await request(app).get('/api/v1/schemes?hasDeadline=true')).body.data.map((s: { name: string }) => s.name)).toEqual(['With Deadline']);
  });

  it('rejects invalid query parameters', async () => {
    expect((await request(app).get('/api/v1/schemes?category=space')).status).toBe(400);
    expect((await request(app).get('/api/v1/schemes?limit=5000')).status).toBe(400);
  });

  it('never reports a scheme as accepting applications unless verified, and flags passed deadlines', async () => {
    await insertScheme({ name: 'Future Unverified', applicationDeadline: addDays(todayIST(), 20) });
    await insertScheme({ name: 'Open Verified', applicationDeadline: addDays(todayIST(), 20), applicationWindowStatus: 'open' });
    await insertScheme({ name: 'Past', applicationDeadline: addDays(todayIST(), -1), applicationWindowStatus: 'open' });
    const res = await request(app).get('/api/v1/schemes?sort=name');
    const byName = Object.fromEntries(res.body.data.map((s: { name: string; windowDisplay: string }) => [s.name, s.windowDisplay]));
    expect(byName['Future Unverified']).toBe('not_verified');
    expect(byName['Open Verified']).toBe('open');
    expect(byName['Past']).toBe('deadline_passed');
    const accepting = await request(app).get('/api/v1/schemes?acceptingOnly=true');
    expect(accepting.body.data.map((s: { name: string }) => s.name)).toEqual(['Open Verified']);
  });

  it('returns scheme details by id or slug, and 404 for drafts or unknown ids', async () => {
    const s = await insertScheme({ name: 'Detail Scheme' });
    const draft = await insertScheme({ publicationStatus: 'draft' });
    const byId = await request(app).get(`/api/v1/schemes/${s._id}`);
    expect(byId.status).toBe(200);
    expect(byId.body.data.requiredDocuments).toHaveLength(2);
    expect((await request(app).get(`/api/v1/schemes/${s.slug}`)).status).toBe(200);
    expect((await request(app).get(`/api/v1/schemes/${draft._id}`)).status).toBe(404);
    expect((await request(app).get('/api/v1/schemes/64b7f0000000000000000000')).status).toBe(404);
  });
});

describe('personalised eligibility', () => {
  it('evaluates stored rules for the logged-in user and filters by status', async () => {
    const s = await insertScheme({ name: 'Income Limited' });
    await insertScheme({
      name: 'Girls Only',
      eligibilityRules: { op: 'all', conditions: [{ field: 'gender', operator: 'equals', value: 'female' }] },
    });
    const { client } = await registeredClient();
    await client.put('/api/v1/profile', { profile: { educationLevel: 'undergraduate', incomeBracket: '1l_2l', gender: 'male' } });

    const elig = await client.get(`/api/v1/schemes/${s._id}/eligibility`);
    expect(elig.status).toBe(200);
    expect(elig.body.data.status).toBe('LIKELY_ELIGIBLE');
    expect(elig.body.data.passed).toHaveLength(2);

    const list = await client.get('/api/v1/schemes?eligibility=NOT_ELIGIBLE');
    expect(list.body.meta.personalised).toBe(true);
    expect(list.body.data.map((x: { name: string }) => x.name)).toEqual(['Girls Only']);

    const rec = await client.get('/api/v1/recommendations');
    expect(rec.body.data.likelyEligible.map((x: { name: string }) => x.name)).toEqual(['Income Limited']);
    expect(rec.body.data.notEligibleCount).toBe(1);
  });

  it('reports unknown income for a bracket that crosses the threshold, and suggests the field', async () => {
    await insertScheme({ eligibilityRules: { op: 'all', conditions: [{ field: 'annualIncome', operator: 'lessThanOrEqual', value: 300000 }] } });
    const { client } = await registeredClient();
    await client.put('/api/v1/profile', { profile: { incomeBracket: '2_5l_3_5l' } });
    const rec = await client.get('/api/v1/recommendations');
    expect(rec.body.data.moreInformationNeeded).toHaveLength(1);
    expect(rec.body.data.impactfulMissingFields[0]).toMatchObject({ field: 'annualIncome', schemeCount: 1 });
  });

  it('requires login for eligibility', async () => {
    const s = await insertScheme();
    expect((await request(app).get(`/api/v1/schemes/${s._id}/eligibility`)).status).toBe(401);
  });

  it('builds a dashboard summary from real data', async () => {
    const s = await insertScheme({ applicationDeadline: addDays(todayIST(), 5) });
    const { client } = await registeredClient();
    await client.put('/api/v1/profile', { profile: { educationLevel: 'undergraduate', annualIncome: 100000 } });
    await client.post('/api/v1/saved', { schemeId: String(s._id) });
    const d = await client.get('/api/v1/dashboard');
    expect(d.status).toBe(200);
    expect(d.body.data.counts).toMatchObject({ likelyEligible: 1, saved: 1, upcomingDeadlines: 1, applications: 0 });
    expect(d.body.data.recentActivity[0].type).toBe('saved');
  });

  it('groups deadlines into upcoming, expired and unknown', async () => {
    await insertScheme({ name: 'Soon', applicationDeadline: addDays(todayIST(), 3) });
    await insertScheme({ name: 'Gone', applicationDeadline: addDays(todayIST(), -3) });
    await insertScheme({ name: 'No Date' });
    const res = await request(app).get('/api/v1/deadlines');
    expect(res.body.data.upcoming.map((s: { name: string }) => s.name)).toEqual(['Soon']);
    expect(res.body.data.upcoming[0].deadline.daysRemaining).toBe(3);
    expect(res.body.data.expired.map((s: { name: string }) => s.name)).toEqual(['Gone']);
    expect(res.body.data.unknown.map((s: { name: string }) => s.name)).toEqual(['No Date']);
    expect((await request(app).get('/api/v1/deadlines?scope=mine')).status).toBe(401);
  });
});
