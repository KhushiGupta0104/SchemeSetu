import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import mongoose, { type FilterQuery } from 'mongoose';
import { Scheme, type SchemeLean } from '../models/Scheme.js';
import { SavedScheme } from '../models/SavedScheme.js';
import { ChecklistProgress } from '../models/ChecklistProgress.js';
import { Application } from '../models/Application.js';
import { User } from '../models/User.js';
import { createSchemeSchema } from '../validators/index.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex, ok, pageMeta } from '../utils/http.js';
import { addDays, toCalendarDate, todayIST } from '../utils/dates.js';
import { slugify } from '../utils/slug.js';
import { deadlineInfo, toSchemeDetail, windowDisplay } from '../services/schemeService.js';
import { SCHEME_CATEGORIES } from '../constants/options.js';

/** Schemes whose source was verified more than this many days ago are flagged for re-verification. */
export const STALE_VERIFICATION_DAYS = 180;

const needsVerificationFilter = (): FilterQuery<SchemeLean> => ({
  isDemo: { $ne: true },
  $or: [
    { verificationStatus: { $ne: 'verified' } },
    { sourceVerifiedAt: null },
    { sourceVerifiedAt: { $lt: addDays(todayIST(), -STALE_VERIFICATION_DAYS) } },
  ],
});

/** Aggregate scheme statistics only — no individual user data is exposed. */
export async function stats(_req: Request, res: Response) {
  const today = todayIST();
  const [total, published, draft, upcoming, needsVerification, demo, recent, byCategory, userCount] = await Promise.all([
    Scheme.countDocuments(),
    Scheme.countDocuments({ publicationStatus: 'published' }),
    Scheme.countDocuments({ publicationStatus: 'draft' }),
    Scheme.countDocuments({ applicationDeadline: { $gte: today, $lte: addDays(today, 30) } }),
    Scheme.countDocuments(needsVerificationFilter()),
    Scheme.countDocuments({ isDemo: true }),
    Scheme.find().sort({ updatedAt: -1 }).limit(6).select('name publicationStatus verificationStatus updatedAt isDemo').lean(),
    Scheme.aggregate<{ _id: string; count: number }>([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
    User.countDocuments({ role: 'user' }),
  ]);
  return ok(res, {
    totals: { total, published, draft, upcomingDeadlines: upcoming, needsVerification, demo, registeredUsers: userCount },
    byCategory: SCHEME_CATEGORIES.map((c) => ({
      category: c.value,
      label: c.label,
      count: byCategory.find((b) => b._id === c.value)?.count ?? 0,
    })),
    recentlyUpdated: recent.map((s) => ({
      id: String(s._id),
      name: s.name,
      publicationStatus: s.publicationStatus,
      verificationStatus: s.verificationStatus,
      isDemo: s.isDemo,
      updatedAt: s.updatedAt,
    })),
    staleVerificationDays: STALE_VERIFICATION_DAYS,
  });
}

export async function listAdminSchemes(req: Request, res: Response) {
  const q = req.query as unknown as {
    q?: string;
    publicationStatus?: string;
    verificationStatus?: string;
    category?: string;
    sort: 'updated' | 'name' | 'deadline';
    page: number;
    limit: number;
  };
  const filter: FilterQuery<SchemeLean> = {};
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), 'i');
    filter.$or = [{ name: rx }, { provider: rx }, { slug: rx }];
  }
  if (q.publicationStatus) filter.publicationStatus = q.publicationStatus;
  if (q.verificationStatus) filter.verificationStatus = q.verificationStatus;
  if (q.category) filter.category = q.category;
  const sort: Record<string, 1 | -1> =
    q.sort === 'name' ? { name: 1 } : q.sort === 'deadline' ? { applicationDeadline: 1, name: 1 } : { updatedAt: -1 };

  const [items, total] = await Promise.all([
    Scheme.find(filter)
      .sort(sort)
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .select('name slug category provider providerType publicationStatus verificationStatus sourceVerifiedAt applicationDeadline applicationWindowStatus isDemo updatedAt')
      .lean<SchemeLean[]>(),
    Scheme.countDocuments(filter),
  ]);
  return ok(
    res,
    items.map((s) => ({
      id: String(s._id),
      name: s.name,
      slug: s.slug,
      category: s.category,
      provider: s.provider,
      providerType: s.providerType,
      publicationStatus: s.publicationStatus,
      verificationStatus: s.verificationStatus,
      sourceVerifiedAt: s.sourceVerifiedAt,
      applicationDeadline: s.applicationDeadline,
      deadline: deadlineInfo(s.applicationDeadline),
      windowDisplay: windowDisplay(s),
      isDemo: s.isDemo,
      updatedAt: s.updatedAt,
    })),
    200,
    pageMeta(q.page, q.limit, total),
  );
}

async function findAnyScheme(id: string) {
  if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest('Invalid id.');
  const s = await Scheme.findById(id);
  if (!s) throw ApiError.notFound('Scheme not found.');
  return s;
}

export async function getAdminScheme(req: Request, res: Response) {
  const s = await findAnyScheme(req.params.id);
  const lean = s.toObject() as unknown as SchemeLean;
  return ok(res, {
    ...toSchemeDetail(lean),
    publicationStatus: lean.publicationStatus,
    createdAt: lean.createdAt,
  });
}

type SchemeInput = ReturnType<typeof createSchemeSchema.parse>;

/** Converts validated input to the stored shape (dates, stable document ids, slug). */
function toStored(input: SchemeInput) {
  const date = (v: string | null | undefined) => (v ? toCalendarDate(v) : null);
  const usedIds = new Set<string>();
  const requiredDocuments = input.requiredDocuments.map((d) => {
    let docId = d.docId || slugify(d.name).slice(0, 40) || 'doc';
    while (usedIds.has(docId)) docId = `${docId.slice(0, 40)}-${crypto.randomBytes(2).toString('hex')}`;
    usedIds.add(docId);
    return { docId, name: d.name, description: d.description || undefined, optional: Boolean(d.optional) };
  });
  return {
    ...input,
    slug: input.slug || slugify(input.name),
    applicableStates: input.isAllIndia ? [] : input.applicableStates,
    requiredDocuments,
    applicationOpenDate: date(input.applicationOpenDate),
    applicationDeadline: date(input.applicationDeadline),
    sourceVerifiedAt: date(input.sourceVerifiedAt),
    applicationUrl: input.applicationUrl || null,
  };
}

async function assertSlugFree(slug: string, exceptId?: string) {
  const existing = await Scheme.findOne({ slug }).select('_id').lean();
  if (existing && String(existing._id) !== exceptId) throw ApiError.conflict(`The slug "${slug}" is already used by another scheme.`);
}

export async function createScheme(req: Request, res: Response) {
  const data = toStored(req.body as SchemeInput);
  await assertSlugFree(data.slug);
  const scheme = await Scheme.create({ ...data, createdBy: req.user!.id, updatedBy: req.user!.id });
  return ok(res, toSchemeDetail(scheme.toObject() as unknown as SchemeLean), 201);
}

/** Serialises a stored scheme back into the API input shape (for merge + re-validation). */
function toInputShape(s: SchemeLean): Record<string, unknown> {
  const d = (v: Date | null | undefined) => (v ? new Date(v).toISOString().slice(0, 10) : null);
  return {
    name: s.name,
    slug: s.slug,
    shortDescription: s.shortDescription,
    description: s.description,
    category: s.category,
    tags: s.tags ?? [],
    provider: s.provider,
    providerType: s.providerType,
    isAllIndia: s.isAllIndia,
    applicableStates: s.applicableStates ?? [],
    educationLevels: s.educationLevels ?? [],
    benefitType: s.benefitType,
    benefitSummary: s.benefitSummary,
    benefits: s.benefits ?? [],
    eligibilityRules: s.eligibilityRules ?? { op: 'all', conditions: [] },
    additionalCriteria: s.additionalCriteria ?? [],
    requiredDocuments: (s.requiredDocuments ?? []).map((x) => ({
      docId: x.docId,
      name: x.name,
      description: x.description ?? '',
      optional: Boolean(x.optional),
    })),
    applicationSteps: s.applicationSteps ?? [],
    applicationOpenDate: d(s.applicationOpenDate),
    applicationDeadline: d(s.applicationDeadline),
    applicationWindowStatus: s.applicationWindowStatus,
    officialSourceUrl: s.officialSourceUrl,
    applicationUrl: s.applicationUrl ?? null,
    sourceVerifiedAt: d(s.sourceVerifiedAt),
    verificationStatus: s.verificationStatus,
    verificationNotes: s.verificationNotes ?? '',
    isDemo: Boolean(s.isDemo),
    publicationStatus: s.publicationStatus,
  };
}

export async function updateScheme(req: Request, res: Response) {
  const scheme = await findAnyScheme(req.params.id);
  const merged = { ...toInputShape(scheme.toObject() as unknown as SchemeLean), ...(req.body as Record<string, unknown>) };
  const parsed = createSchemeSchema.safeParse(merged);
  if (!parsed.success) throw parsed.error;
  const data = toStored(parsed.data);
  await assertSlugFree(data.slug, String(scheme._id));
  scheme.set({ ...data, updatedBy: req.user!.id });
  await scheme.save();
  return ok(res, toSchemeDetail(scheme.toObject() as unknown as SchemeLean));
}

/**
 * Deletes a scheme. Bookmarks and checklist progress for it are removed; users' application
 * records are kept (with the stored scheme name) and shown as "scheme no longer available".
 */
export async function deleteScheme(req: Request, res: Response) {
  const scheme = await findAnyScheme(req.params.id);
  const [saved, checklists, applications] = await Promise.all([
    SavedScheme.deleteMany({ schemeId: scheme._id }),
    ChecklistProgress.deleteMany({ schemeId: scheme._id }),
    Application.countDocuments({ schemeId: scheme._id }),
  ]);
  await scheme.deleteOne();
  return ok(res, {
    id: String(scheme._id),
    deleted: true,
    removedBookmarks: saved.deletedCount,
    removedChecklists: checklists.deletedCount,
    retainedApplications: applications,
  });
}
