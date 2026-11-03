import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Scheme, type SchemeLean } from '../models/Scheme.js';
import { SavedScheme } from '../models/SavedScheme.js';
import { Application } from '../models/Application.js';
import { ChecklistProgress } from '../models/ChecklistProgress.js';
import { LIST_PROJECTION, toSchemeSummary } from '../services/schemeService.js';
import { assertSchemeAvailable } from './schemeController.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex, ok } from '../utils/http.js';

const oid = (id: string) => new mongoose.Types.ObjectId(id);

async function schemeMap(ids: unknown[], publishedOnly = true) {
  const filter: Record<string, unknown> = { _id: { $in: ids } };
  if (publishedOnly) filter.publicationStatus = 'published';
  const docs = await Scheme.find(filter).select(`${LIST_PROJECTION} requiredDocuments`).lean<SchemeLean[]>();
  return new Map(docs.map((d) => [String(d._id), d]));
}

// ============================ Saved schemes ============================

export async function listSaved(req: Request, res: Response) {
  const userId = oid(req.user!.id);
  const saved = await SavedScheme.find({ userId }).sort({ createdAt: -1 }).lean();
  const map = await schemeMap(saved.map((s) => s.schemeId));
  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
  const rx = q ? new RegExp(escapeRegex(q), 'i') : null;

  const items = saved
    .map((s) => {
      const scheme = map.get(String(s.schemeId));
      return {
        schemeId: String(s.schemeId),
        savedAt: s.createdAt,
        available: Boolean(scheme),
        scheme: scheme ? toSchemeSummary(scheme) : null,
      };
    })
    .filter((i) => !rx || (i.scheme && (rx.test(i.scheme.name) || rx.test(i.scheme.provider) || rx.test(i.scheme.shortDescription))));

  return ok(res, items);
}

export async function saveScheme(req: Request, res: Response) {
  const { schemeId } = req.body as { schemeId: string };
  await assertSchemeAvailable(schemeId);
  // Upsert keeps this idempotent; the unique index prevents duplicates even under races.
  const result = await SavedScheme.updateOne(
    { userId: oid(req.user!.id), schemeId: oid(schemeId) },
    { $setOnInsert: { userId: oid(req.user!.id), schemeId: oid(schemeId) } },
    { upsert: true },
  );
  return ok(res, { schemeId, saved: true, created: result.upsertedCount === 1 }, result.upsertedCount ? 201 : 200);
}

export async function unsaveScheme(req: Request, res: Response) {
  const r = await SavedScheme.deleteOne({ userId: oid(req.user!.id), schemeId: oid(req.params.schemeId) });
  if (!r.deletedCount) throw ApiError.notFound('This scheme is not in your saved list.');
  return ok(res, { schemeId: req.params.schemeId, saved: false });
}

// ============================ Applications ============================

type AppDoc = {
  _id: unknown;
  schemeId: unknown;
  schemeName: string;
  status: string;
  appliedAt?: Date | null;
  notes?: string;
  statusHistory?: Array<{ status: string; changedAt: Date; note?: string }>;
  createdAt?: Date;
  updatedAt?: Date;
};

function serializeApplication(a: AppDoc, scheme?: SchemeLean, checklist?: { completed: number; total: number }) {
  return {
    id: String(a._id),
    schemeId: String(a.schemeId),
    schemeName: a.schemeName,
    status: a.status,
    appliedAt: a.appliedAt ?? null,
    notes: a.notes ?? '',
    statusHistory: a.statusHistory ?? [],
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    schemeAvailable: Boolean(scheme),
    scheme: scheme ? toSchemeSummary(scheme) : null,
    checklist: checklist ?? null,
  };
}

async function checklistCounts(userId: mongoose.Types.ObjectId, schemes: Map<string, SchemeLean>) {
  const progress = await ChecklistProgress.find({ userId, schemeId: { $in: [...schemes.keys()].map(oid) } }).lean();
  const byScheme = new Map(progress.map((p) => [String(p.schemeId), new Set(p.completedDocumentIds)]));
  const out = new Map<string, { completed: number; total: number }>();
  for (const [id, s] of schemes) {
    const docs = s.requiredDocuments ?? [];
    const done = byScheme.get(id) ?? new Set();
    out.set(id, { completed: docs.filter((d) => done.has(d.docId)).length, total: docs.length });
  }
  return out;
}

export async function listApplications(req: Request, res: Response) {
  const userId = oid(req.user!.id);
  const apps = await Application.find({ userId }).sort({ updatedAt: -1 }).lean<AppDoc[]>();
  const map = await schemeMap(apps.map((a) => a.schemeId));
  const counts = await checklistCounts(userId, map);
  return ok(res, apps.map((a) => serializeApplication(a, map.get(String(a.schemeId)), counts.get(String(a.schemeId)))));
}

/** Ownership-scoped lookup: another user's application is reported as not found. */
async function findOwnApplication(req: Request) {
  const app = await Application.findOne({ _id: req.params.id, userId: oid(req.user!.id) });
  if (!app) throw ApiError.notFound('Application not found.');
  return app;
}

export async function getApplication(req: Request, res: Response) {
  const app = await findOwnApplication(req);
  const map = await schemeMap([app.schemeId]);
  return ok(res, serializeApplication(app.toObject() as AppDoc, map.get(String(app.schemeId))));
}

export async function createApplication(req: Request, res: Response) {
  const { schemeId, status, notes } = req.body as { schemeId: string; status: string; notes?: string };
  const scheme = await assertSchemeAvailable(schemeId);
  const userId = oid(req.user!.id);
  if (await Application.exists({ userId, schemeId: oid(schemeId) })) {
    throw ApiError.conflict('You are already tracking this scheme.');
  }
  const app = await Application.create({
    userId,
    schemeId: oid(schemeId),
    schemeName: scheme.name,
    status,
    notes: notes ?? '',
    appliedAt: status === 'applied' ? new Date() : null,
    statusHistory: [{ status, changedAt: new Date(), note: 'Started tracking' }],
  });
  return ok(res, serializeApplication(app.toObject() as AppDoc, scheme), 201);
}

export async function updateApplication(req: Request, res: Response) {
  const app = await findOwnApplication(req);
  const body = req.body as { status?: string; appliedAt?: string | null; notes?: string; statusNote?: string };
  if (body.status && body.status !== app.status) {
    app.status = body.status as typeof app.status;
    app.statusHistory.push({ status: body.status, changedAt: new Date(), note: body.statusNote });
    if (body.status === 'applied' && !app.appliedAt && body.appliedAt === undefined) app.appliedAt = new Date();
  }
  if (body.appliedAt !== undefined) {
    if (body.appliedAt) {
      const d = new Date(`${body.appliedAt}T00:00:00Z`);
      if (d.getTime() > Date.now() + 24 * 3600 * 1000) throw ApiError.badRequest('Application date cannot be in the future.');
      app.appliedAt = d;
    } else app.appliedAt = null;
  }
  if (body.notes !== undefined) app.notes = body.notes;
  await app.save();
  const map = await schemeMap([app.schemeId]);
  return ok(res, serializeApplication(app.toObject() as AppDoc, map.get(String(app.schemeId))));
}

export async function deleteApplication(req: Request, res: Response) {
  const app = await findOwnApplication(req);
  await app.deleteOne();
  return ok(res, { id: req.params.id, deleted: true });
}

// ============================ Checklists ============================

/** Checklist overview for every scheme the user has saved or is tracking. */
export async function listChecklists(req: Request, res: Response) {
  const userId = oid(req.user!.id);
  const [saved, apps] = await Promise.all([
    SavedScheme.find({ userId }).select('schemeId').lean(),
    Application.find({ userId }).select('schemeId status').lean(),
  ]);
  const tracked = new Map(apps.map((a) => [String(a.schemeId), a.status]));
  const ids = [...new Set([...apps, ...saved].map((x) => String(x.schemeId)))];
  const map = await schemeMap(ids.map(oid));
  const counts = await checklistCounts(userId, map);
  const items = ids
    .filter((id) => map.has(id))
    .map((id) => ({
      scheme: toSchemeSummary(map.get(id)!),
      tracked: tracked.has(id),
      applicationStatus: tracked.get(id) ?? null,
      ...counts.get(id)!,
    }))
    .sort((a, b) => Number(b.tracked) - Number(a.tracked) || a.scheme.name.localeCompare(b.scheme.name));
  return ok(res, items);
}

async function buildChecklist(userId: mongoose.Types.ObjectId, scheme: SchemeLean) {
  const progress = await ChecklistProgress.findOne({ userId, schemeId: scheme._id }).lean();
  const done = new Set(progress?.completedDocumentIds ?? []);
  // Only current documents are reported: removed requirements drop out, new ones start unchecked.
  const documents = (scheme.requiredDocuments ?? []).map((d) => ({
    docId: d.docId,
    name: d.name,
    description: d.description ?? '',
    optional: Boolean(d.optional),
    completed: done.has(d.docId),
  }));
  return {
    scheme: { id: String(scheme._id), name: scheme.name, slug: scheme.slug, officialSourceUrl: scheme.officialSourceUrl, isDemo: Boolean(scheme.isDemo) },
    documents,
    completedCount: documents.filter((d) => d.completed).length,
    total: documents.length,
    updatedAt: progress?.updatedAt ?? null,
  };
}

export async function getChecklist(req: Request, res: Response) {
  const scheme = await assertSchemeAvailable(req.params.schemeId);
  return ok(res, await buildChecklist(oid(req.user!.id), scheme));
}

export async function updateChecklist(req: Request, res: Response) {
  const scheme = await assertSchemeAvailable(req.params.schemeId);
  const valid = new Set((scheme.requiredDocuments ?? []).map((d) => d.docId));
  const { completedDocumentIds } = req.body as { completedDocumentIds: string[] };
  // Ignore ids that are not (or no longer) required — e.g. if an admin just removed a document.
  const cleaned = [...new Set(completedDocumentIds)].filter((id) => valid.has(id));
  const userId = oid(req.user!.id);
  await ChecklistProgress.updateOne(
    { userId, schemeId: scheme._id },
    { $set: { completedDocumentIds: cleaned } },
    { upsert: true },
  );
  return ok(res, await buildChecklist(userId, scheme));
}
