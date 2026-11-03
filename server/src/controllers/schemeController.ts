import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Scheme, type SchemeLean } from '../models/Scheme.js';
import { SavedScheme } from '../models/SavedScheme.js';
import { Application } from '../models/Application.js';
import { evaluateScheme } from '../services/eligibility/engine.js';
import {
  LIST_PROJECTION,
  findPublishedScheme,
  getUserProfile,
  listPublicSchemes,
  toSchemeDetail,
  toSchemeSummary,
  evaluateAllForUser,
  type ListQuery,
} from '../services/schemeService.js';
import { getRecommendations, profileCompletion } from '../services/recommendations/recommendationService.js';
import { ok, pageMeta } from '../utils/http.js';
import { daysUntil, todayIST } from '../utils/dates.js';
import { ApiError } from '../utils/ApiError.js';
import * as O from '../constants/options.js';

const oid = (id: string) => new mongoose.Types.ObjectId(id);

export async function listSchemes(req: Request, res: Response) {
  const q = req.query as unknown as ListQuery;
  const { items, total } = await listPublicSchemes(q, req.user?.id);
  let savedIds = new Set<string>();
  if (req.user && items.length) {
    const saved = await SavedScheme.find({ userId: oid(req.user.id), schemeId: { $in: items.map((i) => oid(i.id)) } })
      .select('schemeId')
      .lean();
    savedIds = new Set(saved.map((s) => String(s.schemeId)));
  }
  return ok(
    res,
    items.map((i) => ({ ...i, isSaved: savedIds.has(i.id) })),
    200,
    { ...pageMeta(q.page, q.limit, total), personalised: Boolean(req.user) },
  );
}

export async function getScheme(req: Request, res: Response) {
  const scheme = await findPublishedScheme(req.params.id);
  const detail = toSchemeDetail(scheme);
  let personal = null;
  if (req.user) {
    const userId = oid(req.user.id);
    const [saved, application] = await Promise.all([
      SavedScheme.exists({ userId, schemeId: scheme._id }),
      Application.findOne({ userId, schemeId: scheme._id }).select('status').lean(),
    ]);
    personal = {
      isSaved: Boolean(saved),
      application: application ? { id: String(application._id), status: application.status } : null,
    };
  }
  return ok(res, { ...detail, personal });
}

export async function getSchemeEligibility(req: Request, res: Response) {
  const scheme = await findPublishedScheme(req.params.id);
  const profile = await getUserProfile(req.user!.id);
  return ok(res, evaluateScheme(scheme, profile));
}

export async function recommendations(req: Request, res: Response) {
  return ok(res, await getRecommendations(req.user!.id));
}

/** Deadline tracker: all published schemes, or only the user's saved/tracked schemes. */
export async function deadlines(req: Request, res: Response) {
  const scope = req.query.scope === 'mine' ? 'mine' : 'all';
  if (scope === 'mine' && !req.user) throw ApiError.unauthenticated();
  const filter: Record<string, unknown> = { publicationStatus: 'published' };
  if (scope === 'mine') {
    const userId = oid(req.user!.id);
    const [saved, apps] = await Promise.all([
      SavedScheme.find({ userId }).select('schemeId').lean(),
      Application.find({ userId }).select('schemeId').lean(),
    ]);
    filter._id = { $in: [...saved, ...apps].map((x) => x.schemeId) };
  }
  const now = new Date();
  const docs = await Scheme.find(filter).select(LIST_PROJECTION).lean<SchemeLean[]>();
  const items = docs.map((s) => toSchemeSummary(s, null, now));
  const upcoming = items
    .filter((i) => i.deadline.daysRemaining !== null && i.deadline.daysRemaining >= 0)
    .sort((a, b) => a.deadline.daysRemaining! - b.deadline.daysRemaining!);
  const expired = items
    .filter((i) => i.deadline.daysRemaining !== null && i.deadline.daysRemaining < 0)
    .sort((a, b) => b.deadline.daysRemaining! - a.deadline.daysRemaining!);
  const unknown = items.filter((i) => i.deadline.daysRemaining === null).sort((a, b) => a.name.localeCompare(b.name));
  return ok(res, { scope, today: todayIST(now).toISOString().slice(0, 10), upcoming, expired, unknown });
}

/** Dashboard summary — every number is computed from stored data. */
export async function dashboard(req: Request, res: Response) {
  const userId = oid(req.user!.id);
  const [{ rows, now, profile }, saved, apps] = await Promise.all([
    evaluateAllForUser(req.user!.id),
    SavedScheme.find({ userId }).sort({ createdAt: -1 }).lean(),
    Application.find({ userId }).sort({ updatedAt: -1 }).lean(),
  ]);

  const byId = new Map(rows.map((r) => [String(r.s._id), r]));
  const likely = rows.filter((r) => r.e.status === 'LIKELY_ELIGIBLE');
  const moreInfo = rows.filter((r) => r.e.status === 'MORE_INFORMATION_NEEDED');

  // Upcoming deadlines (next 30 days) among schemes that are relevant to this user:
  // likely eligible, needing more info, saved, or tracked.
  const relevantIds = new Set<string>([
    ...likely.map((r) => String(r.s._id)),
    ...moreInfo.map((r) => String(r.s._id)),
    ...saved.map((s) => String(s.schemeId)),
    ...apps.map((a) => String(a.schemeId)),
  ]);
  const upcoming = [...relevantIds]
    .map((id) => byId.get(id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r?.s.applicationDeadline))
    .map((r) => ({ r, days: daysUntil(r.s.applicationDeadline!, now) }))
    .filter((x) => x.days >= 0 && x.days <= 30)
    .sort((a, b) => a.days - b.days);

  const statusCounts = O.APPLICATION_STATUSES.map((s) => ({
    status: s.value,
    label: s.label,
    count: apps.filter((a) => a.status === s.value).length,
  }));

  const activity = [
    ...saved.map((s) => ({
      type: 'saved' as const,
      at: s.createdAt,
      schemeId: String(s.schemeId),
      schemeName: byId.get(String(s.schemeId))?.s.name ?? 'Scheme no longer available',
    })),
    ...apps.flatMap((a) =>
      (a.statusHistory ?? []).map((h) => ({
        type: 'application' as const,
        at: h.changedAt,
        schemeId: String(a.schemeId),
        schemeName: a.schemeName,
        status: h.status,
      })),
    ),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 8);

  return ok(res, {
    counts: {
      likelyEligible: likely.length,
      moreInformationNeeded: moreInfo.length,
      saved: saved.length,
      upcomingDeadlines: upcoming.length,
      applications: apps.length,
      totalSchemes: rows.length,
    },
    recommended: [...likely, ...moreInfo].slice(0, 6).map((r) => toSchemeSummary(r.s, r.e, now)),
    upcomingDeadlines: upcoming.slice(0, 5).map((x) => toSchemeSummary(x.r.s, x.r.e, now)),
    applicationStatusCounts: statusCounts,
    recentActivity: activity,
    profileCompletion: profileCompletion(profile),
    savedIds: saved.map((s) => String(s.schemeId)),
  });
}

/** Public metadata: options, eligibility fields and operators (single source of truth). */
export async function meta(_req: Request, res: Response) {
  res.set('Cache-Control', 'public, max-age=300');
  return ok(res, {
    states: O.STATE_OPTIONS,
    genders: O.GENDERS,
    residenceTypes: O.RESIDENCE_TYPES,
    educationLevels: O.EDUCATION_LEVELS,
    courseStreams: O.COURSE_STREAMS,
    institutionTypes: O.INSTITUTION_TYPES,
    employmentStatuses: O.EMPLOYMENT_STATUSES,
    occupations: O.OCCUPATIONS,
    incomeBrackets: O.INCOME_BRACKET_OPTIONS,
    socialCategories: O.SOCIAL_CATEGORIES,
    minorityCommunities: O.MINORITY_COMMUNITIES,
    disabilityStatuses: O.DISABILITY_STATUSES,
    schemeCategories: O.SCHEME_CATEGORIES,
    providerTypes: O.PROVIDER_TYPES,
    benefitTypes: O.BENEFIT_TYPES,
    verificationStatuses: O.VERIFICATION_STATUSES,
    windowStatuses: O.WINDOW_STATUSES,
    publicationStatuses: O.PUBLICATION_STATUSES,
    applicationStatuses: O.APPLICATION_STATUSES,
    eligibilityFields: O.ELIGIBILITY_FIELDS,
    operatorsByType: O.OPERATORS_BY_TYPE,
    operatorLabels: O.OPERATOR_LABELS,
  });
}

/** Used by checklist/applications to ensure the scheme is available to users. */
export async function assertSchemeAvailable(schemeId: string) {
  const s = await Scheme.findOne({ _id: schemeId, publicationStatus: 'published' }).lean<SchemeLean>();
  if (!s) throw ApiError.notFound('This scheme was not found. It may have been removed or unpublished.');
  return s;
}

