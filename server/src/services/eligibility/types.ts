import type { Operator } from '../../constants/options.js';

/** Three-valued logic result for a single criterion or group. */
export type TriState = 'PASS' | 'FAIL' | 'UNKNOWN';

export type EligibilityStatus = 'LIKELY_ELIGIBLE' | 'NOT_ELIGIBLE' | 'MORE_INFORMATION_NEEDED';

export interface RuleCondition {
  id?: string;
  field: string;
  operator: Operator;
  value?: unknown;
}

export interface RuleGroup {
  op: 'all' | 'any';
  conditions: RuleNode[];
}

export type RuleNode = RuleCondition | RuleGroup;

/** A normalised fact about the user, derived from their profile. */
export type Fact =
  | { kind: 'missing'; reason: 'not_provided' | 'withheld' }
  | { kind: 'enum'; value: string }
  | { kind: 'range'; min: number; max: number; source: 'exact' | 'bracket'; display: string };

export type Facts = Record<string, Fact>;

export interface CriterionResult {
  kind: 'condition' | 'group';
  result: TriState;
  /** Human-readable label, e.g. "Annual family income" or "Any one of the following". */
  label: string;
  /** Plain-language statement of what the scheme requires. */
  requirement: string;
  /** Plain-language explanation of the outcome for this user. */
  reason: string;
  field?: string;
  operator?: Operator;
  expected?: unknown;
  /** Profile field that, if provided, could resolve an UNKNOWN result. */
  missingField?: string;
  /** "geography" for the automatic state-applicability check, "rule" otherwise. */
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
  /** Top-level criteria in evaluation order (groups contain children). */
  criteria: CriterionResult[];
  passed: CriterionSummary[];
  failed: CriterionSummary[];
  unknown: CriterionSummary[];
  /** Profile fields whose absence prevented a definite answer. */
  missingFields: string[];
  /** Conditions stated by the scheme that cannot be checked automatically. */
  additionalChecks: string[];
  /** False when the scheme has no machine-checkable criteria at all. */
  hasAutomatedCriteria: boolean;
  evaluatedAt: string;
}

/** Minimal scheme shape needed for evaluation. */
export interface EvaluableScheme {
  _id: unknown;
  isAllIndia?: boolean;
  applicableStates?: string[];
  eligibilityRules?: unknown;
  additionalCriteria?: string[];
}
