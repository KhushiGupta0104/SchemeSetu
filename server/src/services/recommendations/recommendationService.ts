import { FIELD_MAP } from '../../constants/options.js';
import { STATUS_RANK } from '../eligibility/engine.js';
import { evaluateAllForUser, toSchemeSummary, DUE_SOON_DAYS } from '../schemeService.js';
import { daysUntil } from '../../utils/dates.js';
import type { ProfileInput } from '../eligibility/facts.js';

/** Fields counted for profile completeness. A "Prefer not to say" answer counts as answered. */
const COMPLETION_FIELDS: Array<{ key: string; label: string; test: (p: ProfileInput) => boolean }> = [
  { key: 'age', label: 'Age or date of birth', test: (p) => Boolean(p.dateOfBirth) || typeof p.age === 'number' },
  { key: 'state', label: 'State / UT', test: (p) => Boolean(p.state) },
  { key: 'gender', label: 'Gender', test: (p) => Boolean(p.gender) },
  { key: 'residenceType', label: 'Residence type', test: (p) => Boolean(p.residenceType) },
  { key: 'educationLevel', label: 'Education level', test: (p) => Boolean(p.educationLevel) },
  { key: 'courseStream', label: 'Course stream', test: (p) => Boolean(p.courseStream) },
  { key: 'institutionType', label: 'Institution type', test: (p) => Boolean(p.institutionType) },
  { key: 'previousExamPercentage', label: 'Marks in last exam', test: (p) => typeof p.previousExamPercentage === 'number' },
  { key: 'annualIncome', label: 'Family income', test: (p) => Boolean(p.incomeBracket) || typeof p.annualIncome === 'number' },
  { key: 'socialCategory', label: 'Social category', test: (p) => Boolean(p.socialCategory) },
  { key: 'minorityCommunity', label: 'Minority community', test: (p) => Boolean(p.minorityCommunity) },
  { key: 'disabilityStatus', label: 'Disability status', test: (p) => Boolean(p.disabilityStatus) },
  { key: 'employmentStatus', label: 'Employment status', test: (p) => Boolean(p.employmentStatus) },
  { key: 'occupation', label: 'Occupation', test: (p) => Boolean(p.occupation) },
];

export function profileCompletion(profile: ProfileInput | null) {
  const p = profile ?? {};
  const missing = COMPLETION_FIELDS.filter((f) => !f.test(p));
  const answered = COMPLETION_FIELDS.length - missing.length;
  return {
    answered,
    total: COMPLETION_FIELDS.length,
    percent: Math.round((answered / COMPLETION_FIELDS.length) * 100),
    missing: missing.map((f) => ({ key: f.key, label: f.label, hint: FIELD_MAP[f.key]?.hint ?? '' })),
  };
}

/**
 * Personalised recommendations: every published scheme evaluated by the rule engine, grouped
 * by status and ordered by status, then nearest verified deadline, then name.
 */
export async function getRecommendations(userId: string) {
  const { rows, now, profile } = await evaluateAllForUser(userId);

  rows.sort((a, b) => {
    const r = STATUS_RANK[a.e.status] - STATUS_RANK[b.e.status];
    if (r) return r;
    const demo = Number(Boolean(a.s.isDemo)) - Number(Boolean(b.s.isDemo));
    if (demo) return demo;
    const da = a.s.applicationDeadline ? daysUntil(a.s.applicationDeadline, now) : Infinity;
    const db = b.s.applicationDeadline ? daysUntil(b.s.applicationDeadline, now) : Infinity;
    const ua = da >= 0 ? da : Infinity;
    const ub = db >= 0 ? db : Infinity;
    return ua - ub || a.s.name.localeCompare(b.s.name);
  });

  const likely = rows.filter((r) => r.e.status === 'LIKELY_ELIGIBLE');
  const moreInfo = rows.filter((r) => r.e.status === 'MORE_INFORMATION_NEEDED');
  const notEligible = rows.filter((r) => r.e.status === 'NOT_ELIGIBLE');

  // Which missing profile fields would resolve the most "more information needed" results?
  const impact = new Map<string, number>();
  moreInfo.forEach((r) => r.e.missingFields.forEach((f) => impact.set(f, (impact.get(f) ?? 0) + 1)));
  const impactfulMissingFields = [...impact.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([field, schemeCount]) => ({ field, label: FIELD_MAP[field]?.label ?? field, schemeCount }));

  return {
    likelyEligible: likely.map((r) => toSchemeSummary(r.s, r.e, now)),
    moreInformationNeeded: moreInfo.map((r) => toSchemeSummary(r.s, r.e, now)),
    notEligibleCount: notEligible.length,
    totalEvaluated: rows.length,
    impactfulMissingFields,
    profileCompletion: profileCompletion(profile),
    evaluatedAt: now.toISOString(),
    dueSoonDays: DUE_SOON_DAYS,
  };
}
