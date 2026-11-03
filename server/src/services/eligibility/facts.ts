import {
  ELIGIBILITY_FIELDS,
  INCOME_BRACKETS,
  UNDISCLOSED_VALUES,
  formatINR,
} from '../../constants/options.js';
import { ageOn, todayIST } from '../../utils/dates.js';
import type { Fact, Facts } from './types.js';

/** Profile shape as stored on the user document (all fields optional). */
export interface ProfileInput {
  dateOfBirth?: Date | string | null;
  age?: number | null;
  state?: string | null;
  gender?: string | null;
  residenceType?: string | null;
  educationLevel?: string | null;
  courseStream?: string | null;
  institutionType?: string | null;
  academicYear?: number | null;
  previousExamPercentage?: number | null;
  annualIncome?: number | null;
  incomeBracket?: string | null;
  socialCategory?: string | null;
  minorityCommunity?: string | null;
  disabilityStatus?: string | null;
  employmentStatus?: string | null;
  occupation?: string | null;
  [key: string]: unknown;
}

const NOT_PROVIDED: Fact = { kind: 'missing', reason: 'not_provided' };
const WITHHELD: Fact = { kind: 'missing', reason: 'withheld' };

const isUndisclosed = (v: unknown) =>
  typeof v === 'string' && (UNDISCLOSED_VALUES as readonly string[]).includes(v);

const exact = (n: number, display: string): Fact => ({ kind: 'range', min: n, max: n, source: 'exact', display });

/**
 * Converts a stored profile into normalised facts. Missing or withheld data becomes a
 * `missing` fact — it is never silently converted to a disqualifying value.
 */
export function buildFacts(profile: ProfileInput | null | undefined, now: Date = new Date()): Facts {
  const p = profile ?? {};
  const facts: Facts = {};

  for (const def of ELIGIBILITY_FIELDS) {
    if (def.key === 'age' || def.key === 'annualIncome') continue;
    const raw = p[def.key];
    if (raw === undefined || raw === null || raw === '') facts[def.key] = NOT_PROVIDED;
    else if (isUndisclosed(raw)) facts[def.key] = WITHHELD;
    else if (def.type === 'number') {
      const n = Number(raw);
      facts[def.key] = Number.isFinite(n) ? exact(n, String(n)) : NOT_PROVIDED;
    } else facts[def.key] = { kind: 'enum', value: String(raw) };
  }

  // Age: date of birth takes precedence over a directly entered age.
  if (p.dateOfBirth) {
    const dob = new Date(p.dateOfBirth);
    if (!Number.isNaN(dob.getTime())) {
      const a = ageOn(dob, todayIST(now));
      facts.age = exact(a, `${a} years`);
    } else facts.age = NOT_PROVIDED;
  } else if (typeof p.age === 'number' && Number.isFinite(p.age)) {
    facts.age = exact(p.age, `${p.age} years`);
  } else facts.age = NOT_PROVIDED;

  // Income: an exact figure (if volunteered) beats a bracket. A bracket is an interval.
  if (typeof p.annualIncome === 'number' && Number.isFinite(p.annualIncome) && p.annualIncome >= 0) {
    facts.annualIncome = exact(p.annualIncome, formatINR(p.annualIncome));
  } else if (p.incomeBracket && isUndisclosed(p.incomeBracket)) {
    facts.annualIncome = WITHHELD;
  } else if (p.incomeBracket) {
    const b = INCOME_BRACKETS.find((x) => x.value === p.incomeBracket);
    facts.annualIncome = b
      ? {
          kind: 'range',
          min: b.min,
          max: b.max ?? Number.POSITIVE_INFINITY,
          source: 'bracket',
          display: b.label,
        }
      : NOT_PROVIDED;
  } else facts.annualIncome = NOT_PROVIDED;

  return facts;
}
