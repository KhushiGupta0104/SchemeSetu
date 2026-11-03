import { z } from 'zod';
import mongoose from 'mongoose';
import {
  APPLICATION_STATUSES,
  BENEFIT_TYPES,
  COURSE_STREAMS,
  DISABILITY_STATUSES,
  EDUCATION_LEVELS,
  EMPLOYMENT_STATUSES,
  GENDERS,
  INCOME_BRACKET_OPTIONS,
  INDIAN_STATES,
  INSTITUTION_TYPES,
  MINORITY_COMMUNITIES,
  OCCUPATIONS,
  PROVIDER_TYPES,
  PUBLICATION_STATUSES,
  RESIDENCE_TYPES,
  SCHEME_CATEGORIES,
  SOCIAL_CATEGORIES,
  VERIFICATION_STATUSES,
  WINDOW_STATUSES,
  values,
} from '../constants/options.js';
import { validateRules } from '../services/eligibility/ruleValidator.js';

// ---------------- common ----------------

export const objectId = z
  .string()
  .refine((v) => mongoose.isValidObjectId(v) && /^[a-f0-9]{24}$/i.test(v), 'Invalid id.');

export const idParam = z.object({ id: objectId });
export const schemeIdParam = z.object({ schemeId: objectId });

const pageQuery = {
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
};

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD.')
  .refine((v) => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()), 'Invalid date.');

const httpsUrl = z
  .string()
  .trim()
  .max(500)
  .url('Enter a valid URL.')
  .refine((v) => /^https?:\/\//i.test(v), 'URL must start with http:// or https://');

// ---------------- auth ----------------

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(128, 'Password must be at most 128 characters.')
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), 'Password must contain at least one letter and one number.');

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(80),
    email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(254),
    password,
  })
  .strict(); // rejects unexpected keys such as "role"

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
    password: z.string().min(1, 'Password is required.').max(128),
  })
  .strict();

export const deleteAccountSchema = z.object({ password: z.string().min(1).max(128) }).strict();

// ---------------- profile ----------------

const optEnum = (o: { value: string }[]) => z.enum(values(o as never)).nullable().optional();

export const profileSchema = z
  .object({
    dateOfBirth: isoDate
      .refine((v) => {
        const d = new Date(`${v}T00:00:00Z`);
        const now = new Date();
        return d < now && now.getUTCFullYear() - d.getUTCFullYear() <= 120;
      }, 'Enter a valid date of birth.')
      .nullable()
      .optional(),
    age: z.coerce.number().int().min(5, 'Age must be at least 5.').max(120).nullable().optional(),
    state: z.enum([...INDIAN_STATES] as [string, ...string[]]).nullable().optional(),
    district: z.string().trim().max(80).nullable().optional(),
    gender: optEnum(GENDERS),
    residenceType: optEnum(RESIDENCE_TYPES),
    educationLevel: optEnum(EDUCATION_LEVELS),
    course: z.string().trim().max(120).nullable().optional(),
    courseStream: optEnum(COURSE_STREAMS),
    institutionType: optEnum(INSTITUTION_TYPES),
    academicYear: z.coerce.number().int().min(1).max(10).nullable().optional(),
    previousExamPercentage: z.coerce.number().min(0).max(100).nullable().optional(),
    incomeBracket: optEnum(INCOME_BRACKET_OPTIONS),
    annualIncome: z.coerce.number().int().min(0).max(100_000_000).nullable().optional(),
    socialCategory: optEnum(SOCIAL_CATEGORIES),
    minorityCommunity: optEnum(MINORITY_COMMUNITIES),
    disabilityStatus: optEnum(DISABILITY_STATUSES),
    employmentStatus: optEnum(EMPLOYMENT_STATUSES),
    occupation: optEnum(OCCUPATIONS),
  })
  .strict();

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    profile: profileSchema.optional(),
    completeOnboarding: z.boolean().optional(),
  })
  .strict();

// ---------------- schemes (public) ----------------

const csv = <T extends z.ZodTypeAny>(item: T) =>
  z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : v.split(',')).map((s) => s.trim()).filter(Boolean))
    .pipe(z.array(item).max(20));

export const schemeListQuery = z.object({
  q: z.string().trim().max(100).optional(),
  category: csv(z.enum(values(SCHEME_CATEGORIES))).optional(),
  state: z.enum([...INDIAN_STATES] as [string, ...string[]]).optional(),
  educationLevel: z.enum(values(EDUCATION_LEVELS)).optional(),
  providerType: csv(z.enum(values(PROVIDER_TYPES))).optional(),
  benefitType: csv(z.enum(values(BENEFIT_TYPES))).optional(),
  eligibility: csv(z.enum(['LIKELY_ELIGIBLE', 'MORE_INFORMATION_NEEDED', 'NOT_ELIGIBLE'])).optional(),
  hasDeadline: z.enum(['true', 'false']).optional(),
  acceptingOnly: z.enum(['true', 'false']).optional(),
  includeDemo: z.enum(['true', 'false']).optional(),
  sort: z.enum(['relevance', 'deadline', 'verified', 'name']).default('relevance'),
  ...pageQuery,
});

// ---------------- schemes (admin) ----------------

const documentSchema = z
  .object({
    docId: z
      .string()
      .trim()
      .regex(/^[a-z0-9_-]{1,64}$/i, 'Document id may only contain letters, numbers, - and _.')
      .optional(),
    name: z.string().trim().min(2).max(160),
    description: z.string().trim().max(400).optional().or(z.literal('')),
    optional: z.boolean().optional(),
  })
  .strict();

const rulesSchema = z.unknown().superRefine((val, ctx) => {
  const r = validateRules(val);
  if (!r.ok) {
    for (const issue of r.issues) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${issue.path}: ${issue.message}` });
  }
});

const schemeBase = z
  .object({
    name: z.string().trim().min(3).max(200),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug may contain lowercase letters, numbers and single hyphens.')
      .max(100)
      .optional(),
    shortDescription: z.string().trim().min(10).max(300),
    description: z.string().trim().min(20).max(5000),
    category: z.enum(values(SCHEME_CATEGORIES)),
    tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
    provider: z.string().trim().min(2).max(200),
    providerType: z.enum(values(PROVIDER_TYPES)),
    isAllIndia: z.boolean().default(true),
    applicableStates: z.array(z.enum([...INDIAN_STATES] as [string, ...string[]])).max(36).default([]),
    educationLevels: z.array(z.enum(values(EDUCATION_LEVELS))).max(9).default([]),
    benefitType: z.enum(values(BENEFIT_TYPES)),
    benefitSummary: z.string().trim().min(3).max(300),
    benefits: z.array(z.string().trim().min(1).max(500)).max(20).default([]),
    eligibilityRules: rulesSchema.default({ op: 'all', conditions: [] }),
    additionalCriteria: z.array(z.string().trim().min(1).max(500)).max(20).default([]),
    requiredDocuments: z.array(documentSchema).max(30).default([]),
    applicationSteps: z.array(z.string().trim().min(1).max(500)).max(20).default([]),
    applicationOpenDate: isoDate.nullable().default(null),
    applicationDeadline: isoDate.nullable().default(null),
    applicationWindowStatus: z.enum(values(WINDOW_STATUSES)).default('not_verified'),
    officialSourceUrl: httpsUrl,
    applicationUrl: httpsUrl.nullable().or(z.literal('').transform(() => null)).default(null),
    sourceVerifiedAt: isoDate.nullable().default(null),
    verificationStatus: z.enum(values(VERIFICATION_STATUSES)).default('needs_review'),
    verificationNotes: z.string().trim().max(1000).optional().or(z.literal('')),
    isDemo: z.boolean().default(false),
    publicationStatus: z.enum(values(PUBLICATION_STATUSES)).default('draft'),
  })
  .strict();

type SchemeBase = z.infer<typeof schemeBase>;

function crossFieldChecks(s: Partial<SchemeBase>, ctx: z.RefinementCtx) {
  if (s.isAllIndia === false && (!s.applicableStates || s.applicableStates.length === 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['applicableStates'], message: 'Choose at least one state, or mark the scheme as all-India.' });
  }
  if (s.applicationOpenDate && s.applicationDeadline && s.applicationOpenDate > s.applicationDeadline) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['applicationDeadline'], message: 'Deadline cannot be before the opening date.' });
  }
  if (s.verificationStatus === 'verified' && !s.sourceVerifiedAt) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['sourceVerifiedAt'], message: 'A verified scheme needs a verification date.' });
  }
  if (s.isDemo && s.verificationStatus === 'verified') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['verificationStatus'], message: 'Demo records cannot be marked as verified.' });
  }
  const ids = (s.requiredDocuments ?? []).map((d) => d.docId).filter(Boolean);
  if (new Set(ids).size !== ids.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['requiredDocuments'], message: 'Document ids must be unique.' });
  }
}

export const createSchemeSchema = schemeBase.superRefine(crossFieldChecks);
/** PATCH accepts any subset; the merged result is re-validated with createSchemeSchema. */
export const updateSchemeSchema = schemeBase.partial().strict();

export const adminSchemeListQuery = z.object({
  q: z.string().trim().max(100).optional(),
  publicationStatus: z.enum(values(PUBLICATION_STATUSES)).optional(),
  verificationStatus: z.enum(values(VERIFICATION_STATUSES)).optional(),
  category: z.enum(values(SCHEME_CATEGORIES)).optional(),
  sort: z.enum(['updated', 'name', 'deadline']).default('updated'),
  page: pageQuery.page,
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ---------------- saved / applications / checklist ----------------

export const saveSchemeSchema = z.object({ schemeId: objectId }).strict();

export const createApplicationSchema = z
  .object({
    schemeId: objectId,
    status: z.enum(values(APPLICATION_STATUSES)).default('interested'),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();

export const updateApplicationSchema = z
  .object({
    status: z.enum(values(APPLICATION_STATUSES)).optional(),
    appliedAt: isoDate.nullable().optional(),
    notes: z.string().trim().max(2000).optional(),
    statusNote: z.string().trim().max(300).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update.');

export const updateChecklistSchema = z
  .object({ completedDocumentIds: z.array(z.string().max(64)).max(50) })
  .strict();
