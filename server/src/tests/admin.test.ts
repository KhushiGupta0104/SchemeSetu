import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { adminClient, app, insertScheme, registeredClient, useTestDatabase, validSchemeInput } from './helpers.js';
import { Scheme } from '../models/Scheme.js';
import { SavedScheme } from '../models/SavedScheme.js';
import { Application } from '../models/Application.js';

useTestDatabase('admin');

describe('admin access control', () => {
  it('denies admin APIs to anonymous and normal users', async () => {
    expect((await request(app).get('/api/v1/admin/stats')).status).toBe(401);
    const { client } = await registeredClient();
    expect((await client.get('/api/v1/admin/stats')).status).toBe(403);
    expect((await client.get('/api/v1/admin/schemes')).status).toBe(403);
    expect((await client.post('/api/v1/admin/schemes', validSchemeInput())).status).toBe(403);
    expect(await Scheme.countDocuments()).toBe(0);
  });
});

describe('admin scheme management', () => {
  it('creates a scheme with generated slug and stable document ids', async () => {
    const admin = await adminClient();
    const res = await admin.post('/api/v1/admin/schemes', validSchemeInput({ requiredDocuments: [{ name: 'Income Certificate' }, { name: 'Income Certificate' }] }));
    expect(res.status).toBe(201);
    expect(res.body.data.slug).toBe('test-scholarship-for-undergraduates');
    const ids = res.body.data.requiredDocuments.map((d: { docId: string }) => d.docId);
    expect(new Set(ids).size).toBe(2);
    expect(ids[0]).toBe('income-certificate');
  });

  it('rejects invalid eligibility rules and invalid fields', async () => {
    const admin = await adminClient();
    const bad = await admin.post('/api/v1/admin/schemes', validSchemeInput({
      eligibilityRules: { op: 'all', conditions: [{ field: 'gender', operator: 'greaterThan', value: 'x' }] },
    }));
    expect(bad.status).toBe(400);
    expect(JSON.stringify(bad.body.error.details)).toMatch(/cannot be used with Gender/);
    expect((await admin.post('/api/v1/admin/schemes', validSchemeInput({ officialSourceUrl: 'javascript:alert(1)' }))).status).toBe(400);
    expect((await admin.post('/api/v1/admin/schemes', validSchemeInput({ isAllIndia: false, applicableStates: [] }))).status).toBe(400);
    expect((await admin.post('/api/v1/admin/schemes', validSchemeInput({ verificationStatus: 'verified' }))).status).toBe(400);
    expect(await Scheme.countDocuments()).toBe(0);
  });

  it('prevents duplicate slugs', async () => {
    const admin = await adminClient();
    expect((await admin.post('/api/v1/admin/schemes', validSchemeInput())).status).toBe(201);
    expect((await admin.post('/api/v1/admin/schemes', validSchemeInput())).status).toBe(409);
  });

  it('Scenario B: publish → visible, edit rules → matching updates, unpublish → hidden', async () => {
    const admin = await adminClient();
    const created = await admin.post('/api/v1/admin/schemes', validSchemeInput({ name: 'Scenario Scheme', publicationStatus: 'draft' }));
    const id = created.body.data.id;
    expect((await request(app).get('/api/v1/schemes')).body.data).toHaveLength(0);

    expect((await admin.patch(`/api/v1/admin/schemes/${id}`, { publicationStatus: 'published' })).status).toBe(200);
    expect((await request(app).get('/api/v1/schemes')).body.data.map((s: { id: string }) => s.id)).toEqual([id]);

    const { client } = await registeredClient();
    await client.put('/api/v1/profile', { profile: { educationLevel: 'undergraduate', annualIncome: 300000 } });
    expect((await client.get(`/api/v1/schemes/${id}/eligibility`)).body.data.status).toBe('NOT_ELIGIBLE');

    const edit = await admin.patch(`/api/v1/admin/schemes/${id}`, {
      eligibilityRules: { op: 'all', conditions: [{ field: 'annualIncome', operator: 'lessThanOrEqual', value: 350000 }] },
    });
    expect(edit.status).toBe(200);
    expect((await client.get(`/api/v1/schemes/${id}/eligibility`)).body.data.status).toBe('LIKELY_ELIGIBLE');

    expect((await admin.patch(`/api/v1/admin/schemes/${id}`, { publicationStatus: 'draft' })).status).toBe(200);
    expect((await request(app).get('/api/v1/schemes')).body.data).toHaveLength(0);
    expect((await request(app).get(`/api/v1/schemes/${id}`)).status).toBe(404);
  });

  it('re-validates the merged document on partial updates', async () => {
    const admin = await adminClient();
    const created = await admin.post('/api/v1/admin/schemes', validSchemeInput({ applicationOpenDate: '2026-11-01' }));
    const res = await admin.patch(`/api/v1/admin/schemes/${created.body.data.id}`, { applicationDeadline: '2026-10-01' });
    expect(res.status).toBe(400);
  });

  it('marks a scheme verified only with a verification date', async () => {
    const admin = await adminClient();
    const { body } = await admin.post('/api/v1/admin/schemes', validSchemeInput());
    expect((await admin.patch(`/api/v1/admin/schemes/${body.data.id}`, { verificationStatus: 'verified' })).status).toBe(400);
    const ok = await admin.patch(`/api/v1/admin/schemes/${body.data.id}`, { verificationStatus: 'verified', sourceVerifiedAt: '2026-10-15' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.verificationStatus).toBe('verified');
  });

  it('searches, filters and paginates admin listing including drafts', async () => {
    const admin = await adminClient();
    await insertScheme({ name: 'Published One' });
    await insertScheme({ name: 'Draft One', publicationStatus: 'draft' });
    const all = await admin.get('/api/v1/admin/schemes');
    expect(all.body.meta.total).toBe(2);
    const drafts = await admin.get('/api/v1/admin/schemes?publicationStatus=draft');
    expect(drafts.body.data.map((s: { name: string }) => s.name)).toEqual(['Draft One']);
    expect((await admin.get('/api/v1/admin/schemes?q=published')).body.data).toHaveLength(1);
  });

  it('returns aggregate stats without user personal data', async () => {
    const admin = await adminClient();
    await insertScheme();
    await insertScheme({ publicationStatus: 'draft' });
    const res = await admin.get('/api/v1/admin/stats');
    expect(res.status).toBe(200);
    expect(res.body.data.totals).toMatchObject({ total: 2, published: 1, draft: 1, needsVerification: 2 });
    expect(JSON.stringify(res.body)).not.toMatch(/@example\.com/);
  });

  it('deletes a scheme safely: removes bookmarks, keeps application records', async () => {
    const admin = await adminClient();
    const s = await insertScheme({ name: 'To Delete' });
    const { client } = await registeredClient();
    await client.post('/api/v1/saved', { schemeId: String(s._id) });
    await client.post('/api/v1/applications', { schemeId: String(s._id) });

    const del = await admin.del(`/api/v1/admin/schemes/${s._id}`);
    expect(del.status).toBe(200);
    expect(del.body.data).toMatchObject({ removedBookmarks: 1, retainedApplications: 1 });
    expect(await SavedScheme.countDocuments()).toBe(0);
    expect(await Application.countDocuments()).toBe(1);

    const apps = await client.get('/api/v1/applications');
    expect(apps.body.data[0]).toMatchObject({ schemeName: 'To Delete', schemeAvailable: false });
    expect((await admin.del(`/api/v1/admin/schemes/${s._id}`)).status).toBe(404);
  });
});
