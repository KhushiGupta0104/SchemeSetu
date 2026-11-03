import mongoose, { type FilterQuery } from 'mongoose';
import { Scheme, type SchemeLean } from '../models/Scheme.js';
import { User } from '../models/User.js';
import { evaluateScheme, STATUS_RANK } from './eligibility/engine.js';
import type { EligibilityResult, EligibilityStatus } from './eligibility/types.js';
import type { ProfileInput } from './eligibility/facts.js';
import { daysUntil, todayIST } from '../utils/dates.js';
import { escapeRegex } from '../utils/http.js';
import { ApiError } from '../utils/ApiError.js';

export type DeadlineState = 'upcoming' | 'due_soon' | 'passed' | 'unknown';
/** What the UI should say about the application window. Never "open" unless an admin verified it. */
export type WindowDisplay = 'open' | 'upcoming' | 'closed' | 'deadline_passed' | 'not_verified';

export interface DeadlineInfo {
  date: Date | null;
  daysRemaining: number | null;
  state: DeadlineState;
}

export const DUE_SOON_DAYS = 14;

export function deadlineInfo(deadline: Date | null | undefined, now = new Date()): DeadlineInfo {
  if (!deadline) return { date: null, daysRemaining: null, state: 'unknown' };
  const days = daysUntil(deadline, now);
  return {
    date: deadline,
    daysRemaining: days,
    state: days < 0 ? 'passed' : days <= DUE_SOON_DAYS ? 'due_soon' : 'upcoming',
  };
}

export function windowDisplay(s: Pick<SchemeLean, 'applicationDeadline' | 'applicationWindowStatus'>, now = new Date()): WindowDisplay {
  if (s.applicationDeadline && daysUntil(s.applicationDeadline, now) < 0) return 'deadline_passed';
  return (s.applicationWindowStatus as WindowDisplay) ?? 'not_verified';
}

/** Projection for list views — avoids sending long descriptions/rules where not needed. */
export const LIST_PROJECTION =
  'name slug shortDescription category tags provider providerType isAllIndia applicableStates educationLevels benefitType benefitSummary eligibilityRules additionalCriteria applicationOpenDate applicationDeadline applicationWindowStatus officialSourceUrl applicationUrl sourceVerifiedAt verificationStatus isDemo publicationStatus updatedAt';

export function eligibilitySummary(e: EligibilityResult) {
  return {
    status: e.status,
    passedCount: e.passed.length,
    failedCount: e.failed.length,
    unknownCount: e.unknown.length,
    missingFields: e.missingFields,
    hasAutomatedCriteria: e.hasAutomatedCriteria,
  };
}

export function toSchemeSummary(s: SchemeLean, eligibility?: EligibilityResult | null, now = new Date()) {
  return {
    id: String(s._id),
    name: s.name,
    slug: s.slug,
    shortDescription: s.shortDescription,
    category: s.category,
    tags: s.tags ?? [],
    provider: s.provider,
    providerType: s.providerType,
    isAllIndia: s.isAllIndia,
    applicableStates: s.applicableStates ?? [],
    educationLevels: s.educationLevels ?? [],
    benefitType: s.benefitType,
    benefitSummary: s.benefitSummary,
    applicationOpenDate: s.applicationOpenDate ?? null,
    applicationDeadline: s.applicationDeadline ?? null,
    applicationWindowStatus: s.applicationWindowStatus,
    windowDisplay: windowDisplay(s, now),
    deadline: deadlineInfo(s.applicationDeadline, now),
    officialSourceUrl: s.officialSourceUrl,
    applicationUrl: s.applicationUrl ?? null,
    sourceVerifiedAt: s.sourceVerifiedAt ?? null,
    verificationStatus: s.verificationStatus,
    isDemo: Boolean(s.isDemo),
    updatedAt: s.updatedAt,
    eligibility: eligibility ? eligibilitySummary(eligibility) : null,
  };
}
export type SchemeSummary = ReturnType<typeof toSchemeSummary>;

export function toSchemeDetail(s: SchemeLean, now = new Date()) {
  return {
    ...toSchemeSummary(s, null, now),
    description: s.description,
    benefits: s.benefits ?? [],
    additionalCriteria: s.additionalCriteria ?? [],
    requiredDocuments: (s.requiredDocuments ?? []).map((d) => ({
      docId: d.docId,
      name: d.name,
      description: d.description ?? '',
      optional: Boolean(d.optional),
    })),
    applicationSteps: s.applicationSteps ?? [],
    verificationNotes: s.verificationNotes ?? '',
    eligibilityRules: s.eligibilityRules,
  };
}

export async function getUserProfile(userId: string | undefined): Promise<ProfileInput | null> {
  if (!userId) return null;
  const u = await User.findById(userId).select('profile').lean();
  return (u?.profile as ProfileInput) ?? null;
}

/** Finds a published scheme by ObjectId or slug. */
export async function findPublishedScheme(idOrSlug: string): Promise<SchemeLean> {
  const filter: FilterQuery<SchemeLean> = mongoose.isValidObjectId(idOrSlug) && /^[a-f0-9]{24}$/i.test(idOrSlug)
    ? { _id: idOrSlug }
    : { slug: idOrSlug.toLowerCase() };
  const s = await Scheme.findOne({ ...filter, publicationStatus: 'published' }).lean<SchemeLean>();
  if (!s) throw ApiError.notFound('This scheme was not found. It may have been removed or unpublished.');
  return s;
}

export interface ListQuery {
  q?: string;
  category?: string[];
  state?: string;
  educationLevel?: string;
  providerType?: string[];
  benefitType?: string[];
  eligibility?: EligibilityStatus[];
  hasDeadline?: 'true' | 'false';
  acceptingOnly?: 'true' | 'false';
  includeDemo?: 'true' | 'false';
  sort: 'relevance' | 'deadline' | 'verified' | 'name';
  page: number;
  limit: number;
}

export function buildPublicFilter(q: ListQuery): FilterQuery<SchemeLean> {
  const and: FilterQuery<SchemeLean>[] = [{ publicationStatus: 'published' }];
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), 'i');
    and.push({ $or: [{ name: rx }, { shortDescription: rx }, { description: rx }, { provider: rx }, { tags: rx }, { category: rx }] });
  }
  if (q.category?.length) and.push({ category: { $in: q.category } });
  if (q.providerType?.length) and.push({ providerType: { $in: q.providerType } });
  if (q.benefitType?.length) and.push({ benefitType: { $in: q.benefitType } });
  if (q.state) and.push({ $or: [{ isAllIndia: true }, { applicableStates: q.state }] });
  if (q.educationLevel) and.push({ $or: [{ educationLevels: { $size: 0 } }, { educationLevels: q.educationLevel }] });
  const today = todayIST();
  if (q.hasDeadline === 'true') and.push({ applicationDeadline: { $gte: today } });
  if (q.hasDeadline === 'false') and.push({ applicationDeadline: null });
  if (q.acceptingOnly === 'true') {
    and.push({ applicationWindowStatus: 'open' });
    and.push({ $or: [{ applicationDeadline: null }, { applicationDeadline: { $gte: today } }] });
  }
  if (q.includeDemo === 'false') and.push({ isDemo: { $ne: true } });
  return { $and: and };
}

function textScore(s: SchemeLean, q?: string): number {
  if (!q) return 0;
  const needle = q.toLowerCase();
  const name = s.name.toLowerCase();
  if (name === needle) return 100;
  if (name.startsWith(needle)) return 80;
  if (name.includes(needle)) return 60;
  if ((s.tags ?? []).some((t) => t.toLowerCase().includes(needle))) return 40;
  if (s.provider.toLowerCase().includes(needle)) return 30;
  if (s.shortDescription.toLowerCase().includes(needle)) return 20;
  return 10;
}

/** Upcoming deadlines first (soonest first), then unknown, then passed. */
function deadlineKey(s: SchemeLean, now: Date): number {
  if (!s.applicationDeadline) return 1e12;
  const d = daysUntil(s.applicationDeadline, now);
  return d < 0 ? 2e12 - d : d;
}

/**
 * Lists published schemes with filters, sorting, optional per-user eligibility, and pagination.
 * The published catalogue is small (tens to low hundreds of records), so matching records are
 * evaluated in memory; see docs/ARCHITECTURE.md for how to scale this if the catalogue grows.
 */
export async function listPublicSchemes(q: ListQuery, userId?: string) {
  const now = new Date();
  const docs = await Scheme.find(buildPublicFilter(q)).select(LIST_PROJECTION).limit(2000).lean<SchemeLean[]>();
  const profile = userId ? await getUserProfile(userId) : null;

  let rows = docs.map((s) => ({ s, e: userId ? evaluateScheme(s, profile, now) : null }));
  if (q.eligibility?.length && userId) rows = rows.filter((r) => r.e && q.eligibility!.includes(r.e.status));

  const sortName = (s: SchemeLean) => s.name.replace(/^\[DEMO\]\s*/, '');
  const byName = (a: SchemeLean, b: SchemeLean) => sortName(a).localeCompare(sortName(b));
  rows.sort((a, b) => {
    switch (q.sort) {
      case 'name':
        return byName(a.s, b.s);
      case 'deadline':
        return deadlineKey(a.s, now) - deadlineKey(b.s, now) || byName(a.s, b.s);
      case 'verified':
        return (b.s.sourceVerifiedAt?.getTime() ?? 0) - (a.s.sourceVerifiedAt?.getTime() ?? 0) || byName(a.s, b.s);
      default: {
        const t = textScore(b.s, q.q) - textScore(a.s, q.q);
        if (t) return t;
        if (a.e && b.e) {
          const r = STATUS_RANK[a.e.status] - STATUS_RANK[b.e.status];
          if (r) return r;
        }
        // Real, verified records before demo records.
        const demo = Number(Boolean(a.s.isDemo)) - Number(Boolean(b.s.isDemo));
        if (demo) return demo;
        return deadlineKey(a.s, now) - deadlineKey(b.s, now) || byName(a.s, b.s);
      }
    }
  });

  const total = rows.length;
  const start = (q.page - 1) * q.limit;
  const items = rows.slice(start, start + q.limit).map((r) => toSchemeSummary(r.s, r.e, now));
  return { items, total };
}

/** Evaluates every published scheme for a user (single eligibility service for all views). */
export async function evaluateAllForUser(userId: string) {
  const now = new Date();
  const [docs, profile] = await Promise.all([
    Scheme.find({ publicationStatus: 'published' }).select(LIST_PROJECTION).lean<SchemeLean[]>(),
    getUserProfile(userId),
  ]);
  return { now, profile, rows: docs.map((s) => ({ s, e: evaluateScheme(s, profile, now) })) };
}
