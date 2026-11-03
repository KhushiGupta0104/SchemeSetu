import { describe, expect, it } from 'vitest';
import { adminClient, insertScheme, registeredClient, useTestDatabase } from './helpers.js';
import { SavedScheme } from '../models/SavedScheme.js';

useTestDatabase('userdata');

describe('saved schemes', () => {
  it('saves idempotently, lists, searches and removes bookmarks', async () => {
    const s = await insertScheme({ name: 'Bookmark Me' });
    await insertScheme({ name: 'Other Scheme' });
    const { client } = await registeredClient();
    expect((await client.post('/api/v1/saved', { schemeId: String(s._id) })).status).toBe(201);
    expect((await client.post('/api/v1/saved', { schemeId: String(s._id) })).status).toBe(200);
    expect(await SavedScheme.countDocuments()).toBe(1);

    const list = await client.get('/api/v1/saved');
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].scheme.name).toBe('Bookmark Me');
    expect((await client.get('/api/v1/saved?q=nothing')).body.data).toHaveLength(0);

    const detail = await client.get(`/api/v1/schemes/${s._id}`);
    expect(detail.body.data.personal.isSaved).toBe(true);

    expect((await client.del(`/api/v1/saved/${s._id}`)).status).toBe(200);
    expect((await client.del(`/api/v1/saved/${s._id}`)).status).toBe(404);
  });

  it('persists across logout and login', async () => {
    const s = await insertScheme();
    const { client, creds } = await registeredClient();
    await client.post('/api/v1/saved', { schemeId: String(s._id) });
    await client.post('/api/v1/auth/logout');
    await client.post('/api/v1/auth/login', { email: creds.email, password: creds.password });
    expect((await client.get('/api/v1/saved')).body.data).toHaveLength(1);
  });

  it('cannot save unpublished or non-existent schemes', async () => {
    const draft = await insertScheme({ publicationStatus: 'draft' });
    const { client } = await registeredClient();
    expect((await client.post('/api/v1/saved', { schemeId: String(draft._id) })).status).toBe(404);
    expect((await client.post('/api/v1/saved', { schemeId: 'not-an-id' })).status).toBe(400);
  });
});

describe('applications', () => {
  it('tracks an application with status history, notes and applied date', async () => {
    const s = await insertScheme();
    const { client } = await registeredClient();
    const created = await client.post('/api/v1/applications', { schemeId: String(s._id) });
    expect(created.status).toBe(201);
    expect(created.body.data.status).toBe('interested');
    expect((await client.post('/api/v1/applications', { schemeId: String(s._id) })).status).toBe(409);

    const id = created.body.data.id;
    const upd = await client.patch(`/api/v1/applications/${id}`, { status: 'applied', notes: 'Submitted on portal', statusNote: 'Done' });
    expect(upd.status).toBe(200);
    expect(upd.body.data.statusHistory.map((h: { status: string }) => h.status)).toEqual(['interested', 'applied']);
    expect(upd.body.data.appliedAt).not.toBeNull();
    expect(upd.body.data.notes).toBe('Submitted on portal');

    expect((await client.patch(`/api/v1/applications/${id}`, { status: 'teleported' })).status).toBe(400);
    expect((await client.patch(`/api/v1/applications/${id}`, { appliedAt: '2999-01-01' })).status).toBe(400);
    expect((await client.patch(`/api/v1/applications/${id}`, {})).status).toBe(400);

    expect((await client.del(`/api/v1/applications/${id}`)).status).toBe(200);
    expect((await client.get('/api/v1/applications')).body.data).toHaveLength(0);
  });

  it("Scenario C: a user cannot read, change or delete another user's application", async () => {
    const s = await insertScheme();
    const alice = await registeredClient();
    const bob = await registeredClient();
    const app = await alice.client.post('/api/v1/applications', { schemeId: String(s._id) });
    const id = app.body.data.id;
    expect((await bob.client.get(`/api/v1/applications/${id}`)).status).toBe(404);
    expect((await bob.client.patch(`/api/v1/applications/${id}`, { status: 'approved' })).status).toBe(404);
    expect((await bob.client.del(`/api/v1/applications/${id}`)).status).toBe(404);
    expect((await bob.client.get('/api/v1/applications')).body.data).toHaveLength(0);
    expect((await alice.client.get(`/api/v1/applications/${id}`)).body.data.status).toBe('interested');
  });
});

describe('document checklist', () => {
  it('persists completion and handles added/removed requirements', async () => {
    const admin = await adminClient();
    const s = await insertScheme({
      requiredDocuments: [
        { docId: 'id-proof', name: 'Identity proof' },
        { docId: 'income-cert', name: 'Income certificate' },
      ],
    });
    const { client } = await registeredClient();
    const put = await client.put(`/api/v1/checklists/${s._id}`, { completedDocumentIds: ['id-proof', 'income-cert', 'bogus'] });
    expect(put.status).toBe(200);
    expect(put.body.data.completedCount).toBe(2);

    // Admin removes one document and adds another; existing progress is preserved by stable id.
    await admin.patch(`/api/v1/admin/schemes/${s._id}`, {
      requiredDocuments: [
        { docId: 'id-proof', name: 'Identity proof (renamed)' },
        { docId: 'photo', name: 'Photograph' },
      ],
    });
    const get = await client.get(`/api/v1/checklists/${s._id}`);
    expect(get.body.data.total).toBe(2);
    expect(get.body.data.documents).toEqual([
      expect.objectContaining({ docId: 'id-proof', name: 'Identity proof (renamed)', completed: true }),
      expect.objectContaining({ docId: 'photo', completed: false }),
    ]);
    expect(get.body.data.completedCount).toBe(1);
  });

  it('lists checklists for saved and tracked schemes with progress counts', async () => {
    const a = await insertScheme({ name: 'Tracked' });
    const b = await insertScheme({ name: 'Saved' });
    const { client } = await registeredClient();
    await client.post('/api/v1/applications', { schemeId: String(a._id) });
    await client.post('/api/v1/saved', { schemeId: String(b._id) });
    await client.put(`/api/v1/checklists/${a._id}`, { completedDocumentIds: ['id-proof'] });
    const res = await client.get('/api/v1/checklists');
    expect(res.body.data.map((x: { scheme: { name: string } }) => x.scheme.name)).toEqual(['Tracked', 'Saved']);
    expect(res.body.data[0]).toMatchObject({ tracked: true, completed: 1, total: 2 });
  });

  it('checklists are private to each user', async () => {
    const s = await insertScheme();
    const alice = await registeredClient();
    const bob = await registeredClient();
    await alice.client.put(`/api/v1/checklists/${s._id}`, { completedDocumentIds: ['id-proof'] });
    expect((await bob.client.get(`/api/v1/checklists/${s._id}`)).body.data.completedCount).toBe(0);
  });
});
