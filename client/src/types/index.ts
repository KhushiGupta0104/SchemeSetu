export interface Option {
  value: string;
  label: string;
}

export type Role = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  onboardingCompleted: boolean;
  createdAt: string;
}

export type EligibilityStatus = 'LIKELY_ELIGIBLE' | 'NOT_ELIGIBLE' | 'MORE_INFORMATION_NEEDED';
export type TriState = 'PASS' | 'FAIL' | 'UNKNOWN';
export type WindowDisplay = 'open' | 'upcoming' | 'closed' | 'deadline_passed' | 'not_verified';
export type DeadlineState = 'upcoming' | 'due_soon' | 'passed' | 'unknown';

export interface DeadlineInfo {
  date: string | null;
  daysRemaining: number | null;
  state: DeadlineState;
}

export interface EligibilitySummary {
  status: EligibilityStatus;
  passedCount: number;
  failedCount: number;
  unknownCount: number;
  missingFields: string[];
  hasAutomatedCriteria: boolean;
}

export interface SchemeSummary {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  category: string;
  tags: string[];
  provider: string;
  providerType: string;
  isAllIndia: boolean;
  applicableStates: string[];
  educationLevels: string[];
  benefitType: string;
  benefitSummary: string;
  applicationOpenDate: string | null;
  applicationDeadline: string | null;
  applicationWindowStatus: string;
  windowDisplay: WindowDisplay;
  deadline: DeadlineInfo;
  officialSourceUrl: string;
  applicationUrl: string | null;
  sourceVerifiedAt: string | null;
  verificationStatus: 'verified' | 'needs_review' | 'demo';
  isDemo: boolean;
  updatedAt: string;
  eligibility: EligibilitySummary | null;
  isSaved?: boolean;
}

export interface RequiredDocument {
  docId: string;
  name: string;
  description: string;
  optional: boolean;
}

export interface RuleCondition {
  id?: string;
  field: string;
  operator: string;
  value?: unknown;
}
export interface RuleGroup {
  op: 'all' | 'any';
  conditions: RuleNode[];
}
export type RuleNode = RuleCondition | RuleGroup;

export interface SchemeDetail extends SchemeSummary {
  description: string;
  benefits: string[];
  additionalCriteria: string[];
  requiredDocuments: RequiredDocument[];
  applicationSteps: string[];
  verificationNotes: string;
  eligibilityRules: RuleGroup;
  personal: { isSaved: boolean; application: { id: string; status: string } | null } | null;
}

export interface CriterionResult {
  kind: 'condition' | 'group';
  result: TriState;
  label: string;
  requirement: string;
  reason: string;
  field?: string;
  source?: 'rule' | 'geography';
  op?: 'all' | 'any';
  children?: CriterionResult[];
}

export interface CriterionSummary {
  field: string;
  label: string;
  requirement: string;
  reason: string;
}

export interface EligibilityResult {
  schemeId: string;
  status: EligibilityStatus;
  criteria: CriterionResult[];
  passed: CriterionSummary[];
  failed: CriterionSummary[];
  unknown: CriterionSummary[];
  missingFields: string[];
  additionalChecks: string[];
  hasAutomatedCriteria: boolean;
  evaluatedAt: string;
}

export interface Profile {
  dateOfBirth?: string;
  age?: number;
  state?: string;
  district?: string;
  gender?: string;
  residenceType?: string;
  educationLevel?: string;
  course?: string;
  courseStream?: string;
  institutionType?: string;
  academicYear?: number;
  previousExamPercentage?: number;
  incomeBracket?: string;
  annualIncome?: number;
  socialCategory?: string;
  minorityCommunity?: string;
  disabilityStatus?: string;
  employmentStatus?: string;
  occupation?: string;
}

export interface ProfileCompletion {
  answered: number;
  total: number;
  percent: number;
  missing: Array<{ key: string; label: string; hint: string }>;
}

export interface ProfileResponse {
  name: string;
  email: string;
  profile: Profile;
  onboardingCompleted: boolean;
  completion: ProfileCompletion;
}

export interface EligibilityFieldDef {
  key: string;
  label: string;
  type: 'enum' | 'number';
  options?: Option[];
  unit?: 'inr' | 'years' | 'percent' | 'year_of_study';
  hint: string;
}

export interface Meta {
  states: Option[];
  genders: Option[];
  residenceTypes: Option[];
  educationLevels: Option[];
  courseStreams: Option[];
  institutionTypes: Option[];
  employmentStatuses: Option[];
  occupations: Option[];
  incomeBrackets: Option[];
  socialCategories: Option[];
  minorityCommunities: Option[];
  disabilityStatuses: Option[];
  schemeCategories: Option[];
  providerTypes: Option[];
  benefitTypes: Option[];
  verificationStatuses: Option[];
  windowStatuses: Option[];
  publicationStatuses: Option[];
  applicationStatuses: Option[];
  eligibilityFields: EligibilityFieldDef[];
  operatorsByType: Record<'enum' | 'number', string[]>;
  operatorLabels: Record<string, string>;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  personalised?: boolean;
}

export interface SavedItem {
  schemeId: string;
  savedAt: string;
  available: boolean;
  scheme: SchemeSummary | null;
}

export interface StatusHistoryEntry {
  status: string;
  changedAt: string;
  note?: string;
}

export interface Application {
  id: string;
  schemeId: string;
  schemeName: string;
  status: string;
  appliedAt: string | null;
  notes: string;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
  schemeAvailable: boolean;
  scheme: SchemeSummary | null;
  checklist: { completed: number; total: number } | null;
}

export interface Checklist {
  scheme: { id: string; name: string; slug: string; officialSourceUrl: string; isDemo: boolean };
  documents: Array<RequiredDocument & { completed: boolean }>;
  completedCount: number;
  total: number;
  updatedAt: string | null;
}

export interface ChecklistSummary {
  scheme: SchemeSummary;
  tracked: boolean;
  applicationStatus: string | null;
  completed: number;
  total: number;
}

export interface DeadlinesResponse {
  scope: 'all' | 'mine';
  today: string;
  upcoming: SchemeSummary[];
  expired: SchemeSummary[];
  unknown: SchemeSummary[];
}

export interface Recommendations {
  likelyEligible: SchemeSummary[];
  moreInformationNeeded: SchemeSummary[];
  notEligibleCount: number;
  totalEvaluated: number;
  impactfulMissingFields: Array<{ field: string; label: string; schemeCount: number }>;
  profileCompletion: ProfileCompletion;
  evaluatedAt: string;
}

export interface DashboardData {
  counts: {
    likelyEligible: number;
    moreInformationNeeded: number;
    saved: number;
    upcomingDeadlines: number;
    applications: number;
    totalSchemes: number;
  };
  recommended: SchemeSummary[];
  upcomingDeadlines: SchemeSummary[];
  applicationStatusCounts: Array<{ status: string; label: string; count: number }>;
  recentActivity: Array<{ type: 'saved' | 'application'; at: string; schemeId: string; schemeName: string; status?: string }>;
  profileCompletion: ProfileCompletion;
  savedIds: string[];
}

export interface AiAnswer {
  source: 'ai' | 'fallback';
  answer: string;
  notice?: string;
  model?: string;
}

export interface AdminStats {
  totals: {
    total: number;
    published: number;
    draft: number;
    upcomingDeadlines: number;
    needsVerification: number;
    demo: number;
    registeredUsers: number;
  };
  byCategory: Array<{ category: string; label: string; count: number }>;
  recentlyUpdated: Array<{ id: string; name: string; publicationStatus: string; verificationStatus: string; isDemo: boolean; updatedAt: string }>;
  staleVerificationDays: number;
}

export interface AdminSchemeRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  provider: string;
  providerType: string;
  publicationStatus: 'draft' | 'published';
  verificationStatus: string;
  sourceVerifiedAt: string | null;
  applicationDeadline: string | null;
  deadline: DeadlineInfo;
  windowDisplay: WindowDisplay;
  isDemo: boolean;
  updatedAt: string;
}

/** Shape sent to POST/PATCH /admin/schemes. */
export interface SchemeInput {
  name: string;
  slug?: string;
  shortDescription: string;
  description: string;
  category: string;
  tags: string[];
  provider: string;
  providerType: string;
  isAllIndia: boolean;
  applicableStates: string[];
  educationLevels: string[];
  benefitType: string;
  benefitSummary: string;
  benefits: string[];
  eligibilityRules: RuleGroup;
  additionalCriteria: string[];
  requiredDocuments: Array<{ docId?: string; name: string; description?: string; optional?: boolean }>;
  applicationSteps: string[];
  applicationOpenDate: string | null;
  applicationDeadline: string | null;
  applicationWindowStatus: string;
  officialSourceUrl: string;
  applicationUrl: string | null;
  sourceVerifiedAt: string | null;
  verificationStatus: string;
  verificationNotes?: string;
  isDemo: boolean;
  publicationStatus: 'draft' | 'published';
}

export interface AdminSchemeDetail extends Omit<SchemeDetail, 'personal'> {
  publicationStatus: 'draft' | 'published';
  createdAt: string;
}
