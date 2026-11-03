import {
  FIELD_MAP,
  OPERATORS_BY_TYPE,
  formatNumberForField,
  optionLabel,
  type Operator,
} from '../../constants/options.js';
import { buildFacts, type ProfileInput } from './facts.js';
import { isGroup } from './ruleValidator.js';
import type {
  CriterionResult,
  CriterionSummary,
  EligibilityResult,
  EligibilityStatus,
  EvaluableScheme,
  Fact,
  Facts,
  RuleCondition,
  TriState,
} from './types.js';

// ---------------------------------------------------------------------------
// Three-valued (Kleene) logic
// ---------------------------------------------------------------------------

/** AND: any FAIL -> FAIL; all PASS -> PASS; otherwise UNKNOWN. Empty AND is PASS. */
export function and3(values: TriState[]): TriState {
  if (values.includes('FAIL')) return 'FAIL';
  if (values.every((v) => v === 'PASS')) return 'PASS';
  return 'UNKNOWN';
}

/** OR: any PASS -> PASS; all FAIL -> FAIL; otherwise UNKNOWN. Empty OR is FAIL. */
export function or3(values: TriState[]): TriState {
  if (values.includes('PASS')) return 'PASS';
  if (values.every((v) => v === 'FAIL')) return 'FAIL';
  return 'UNKNOWN';
}

// ---------------------------------------------------------------------------
// Leaf comparisons
// ---------------------------------------------------------------------------

/** Compares a numeric interval [min, max] (exact values have min === max) with a threshold. */
export function compareRange(min: number, max: number, op: Operator, t: number): TriState {
  switch (op) {
    case 'lessThanOrEqual':
      return max <= t ? 'PASS' : min > t ? 'FAIL' : 'UNKNOWN';
    case 'lessThan':
      return max < t ? 'PASS' : min >= t ? 'FAIL' : 'UNKNOWN';
    case 'greaterThanOrEqual':
      return min >= t ? 'PASS' : max < t ? 'FAIL' : 'UNKNOWN';
    case 'greaterThan':
      return min > t ? 'PASS' : max <= t ? 'FAIL' : 'UNKNOWN';
    case 'equals':
      return min === t && max === t ? 'PASS' : t < min || t > max ? 'FAIL' : 'UNKNOWN';
    case 'notEquals':
      return min === t && max === t ? 'FAIL' : t < min || t > max ? 'PASS' : 'UNKNOWN';
    default:
      return 'UNKNOWN';
  }
}

function compareEnum(actual: string, op: Operator, expected: unknown): TriState {
  switch (op) {
    case 'equals':
      return actual === expected ? 'PASS' : 'FAIL';
    case 'notEquals':
      return actual !== expected ? 'PASS' : 'FAIL';
    case 'in':
      return Array.isArray(expected) && expected.includes(actual) ? 'PASS' : 'FAIL';
    case 'notIn':
      return Array.isArray(expected) && !expected.includes(actual) ? 'PASS' : 'FAIL';
    default:
      return 'UNKNOWN';
  }
}

// ---------------------------------------------------------------------------
// Explanations
// ---------------------------------------------------------------------------

function describeValue(field: string, value: unknown): string {
  if (Array.isArray(value)) {
    const labels = value.map((v) => optionLabel(field, v));
    return labels.length > 4 ? `${labels.slice(0, 4).join(', ')} or ${labels.length - 4} more` : labels.join(', ');
  }
  if (typeof value === 'number') return formatNumberForField(field, value);
  return optionLabel(field, value);
}

export function describeRequirement(c: RuleCondition): string {
  const def = FIELD_MAP[c.field];
  const label = def?.label ?? c.field;
  const v = describeValue(c.field, c.value);
  switch (c.operator) {
    case 'equals':
      return `${label} must be ${v}`;
    case 'notEquals':
      return `${label} must not be ${v}`;
    case 'in':
      return `${label} must be one of: ${v}`;
    case 'notIn':
      return `${label} must not be any of: ${v}`;
    case 'greaterThan':
      return `${label} must be more than ${v}`;
    case 'greaterThanOrEqual':
      return `${label} must be at least ${v}`;
    case 'lessThan':
      return `${label} must be less than ${v}`;
    case 'lessThanOrEqual':
      return `${label} must not exceed ${v}`;
    case 'exists':
      return `${label} must be provided`;
    default:
      return `${label} requirement`;
  }
}

function factDisplay(field: string, fact: Fact): string {
  if (fact.kind === 'enum') return optionLabel(field, fact.value);
  if (fact.kind === 'range') return fact.display;
  return '';
}

function explain(c: RuleCondition, fact: Fact, result: TriState): string {
  const def = FIELD_MAP[c.field];
  const full = def?.label ?? c.field;
  const label = full.charAt(0).toLowerCase() + full.slice(1);
  if (fact.kind === 'missing') {
    return fact.reason === 'withheld'
      ? `You chose not to share your ${label}, so this requirement can't be checked automatically. That's fine — it is not counted against you.`
      : `Your profile doesn't include your ${label} yet. Add it to check this requirement.`;
  }
  const shown = factDisplay(c.field, fact);
  if (result === 'PASS') return `Your ${label} (${shown}) meets this requirement.`;
  if (result === 'FAIL') return `Your ${label} (${shown}) does not meet this requirement.`;
  if (fact.kind === 'range' && fact.source === 'bracket') {
    return `Your income bracket (${shown}) spans this limit, so we can't tell for sure. Adding your exact annual income (optional) would resolve this.`;
  }
  return `We couldn't determine whether your ${label} (${shown}) meets this requirement.`;
}

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

function malformed(label: string): CriterionResult {
  return {
    kind: 'condition',
    result: 'UNKNOWN',
    label,
    requirement: 'A scheme condition that could not be read',
    reason: 'This condition is not configured correctly, so it was not used to judge your eligibility. Please check the official source.',
  };
}

export function evaluateCondition(c: RuleCondition, facts: Facts): CriterionResult {
  const def = FIELD_MAP[c?.field];
  if (!def || !OPERATORS_BY_TYPE[def.type].includes(c.operator)) return malformed(def?.label ?? 'Unrecognised condition');

  const fact = facts[c.field] ?? { kind: 'missing', reason: 'not_provided' };
  let result: TriState;

  if (fact.kind === 'missing') result = 'UNKNOWN';
  else if (c.operator === 'exists') result = 'PASS';
  else if (def.type === 'number') {
    if (fact.kind !== 'range' || typeof c.value !== 'number' || !Number.isFinite(c.value)) return malformed(def.label);
    result = compareRange(fact.min, fact.max, c.operator, c.value);
  } else {
    if (fact.kind !== 'enum') return malformed(def.label);
    if ((c.operator === 'in' || c.operator === 'notIn') && !Array.isArray(c.value)) return malformed(def.label);
    result = compareEnum(fact.value, c.operator, c.value);
  }

  return {
    kind: 'condition',
    result,
    label: def.label,
    field: c.field,
    operator: c.operator,
    expected: c.value,
    requirement: describeRequirement(c),
    reason: explain(c, fact, result),
    ...(result === 'UNKNOWN' ? { missingField: c.field } : {}),
    source: 'rule',
  };
}

export function evaluateNode(node: unknown, facts: Facts, depth = 1): CriterionResult {
  if (isGroup(node)) {
    const op = node.op;
    if ((op !== 'all' && op !== 'any') || !Array.isArray(node.conditions) || depth > 5) {
      return malformed('Condition group');
    }
    const children = node.conditions.map((c) => evaluateNode(c, facts, depth + 1));
    const result = op === 'all' ? and3(children.map((c) => c.result)) : or3(children.map((c) => c.result));
    const label = op === 'any' ? 'Any one of the following' : 'All of the following';
    const reason =
      op === 'any'
        ? result === 'PASS'
          ? 'At least one of these options applies to you.'
          : result === 'FAIL'
            ? 'None of these options apply to you.'
            : 'None of these options is confirmed yet, but some could not be checked with your current profile.'
        : result === 'PASS'
          ? 'You meet every condition in this group.'
          : result === 'FAIL'
            ? 'At least one condition in this group is not met.'
            : 'Some conditions in this group could not be checked yet.';
    return {
      kind: 'group',
      op,
      result,
      label,
      requirement: op === 'any' ? 'At least one of these must apply' : 'All of these must apply',
      reason,
      children,
      source: 'rule',
    };
  }
  if (typeof node !== 'object' || node === null) return malformed('Unrecognised condition');
  return evaluateCondition(node as RuleCondition, facts);
}

/** Collects profile fields that could resolve UNKNOWN results (only where they still matter). */
function collectMissing(r: CriterionResult, out: Set<string>) {
  if (r.result !== 'UNKNOWN') return;
  if (r.missingField) out.add(r.missingField);
  r.children?.forEach((c) => collectMissing(c, out));
}

const STATUS_BY_RESULT: Record<TriState, EligibilityStatus> = {
  PASS: 'LIKELY_ELIGIBLE',
  FAIL: 'NOT_ELIGIBLE',
  UNKNOWN: 'MORE_INFORMATION_NEEDED',
};

/**
 * Evaluates one scheme against a user profile. This is the single eligibility service used by
 * the dashboard, explorer, scheme details and recommendations.
 *
 * - State applicability (non all-India schemes) is checked automatically as a mandatory criterion.
 * - The root rule group is mandatory: any FAIL -> NOT_ELIGIBLE; all PASS -> LIKELY_ELIGIBLE;
 *   otherwise MORE_INFORMATION_NEEDED.
 * - A scheme with no machine-checkable criteria yields MORE_INFORMATION_NEEDED (never a fake match).
 */
export function evaluateScheme(
  scheme: EvaluableScheme,
  profile: ProfileInput | null | undefined,
  now: Date = new Date(),
): EligibilityResult {
  const facts = buildFacts(profile, now);
  const criteria: CriterionResult[] = [];

  if (!scheme.isAllIndia && Array.isArray(scheme.applicableStates) && scheme.applicableStates.length > 0) {
    const geo = evaluateCondition({ field: 'state', operator: 'in', value: scheme.applicableStates }, facts);
    geo.source = 'geography';
    criteria.push(geo);
  }

  const rules = scheme.eligibilityRules;
  if (rules !== undefined && rules !== null) {
    if (isGroup(rules) && rules.op === 'all' && Array.isArray(rules.conditions)) {
      // Flatten the root AND group so each top-level condition is listed on its own.
      for (const c of rules.conditions) criteria.push(evaluateNode(c, facts, 2));
    } else if (isGroup(rules) && rules.op === 'any' && Array.isArray(rules.conditions)) {
      if (rules.conditions.length) criteria.push(evaluateNode(rules, facts, 1));
    } else {
      criteria.push(malformed('Eligibility rules'));
    }
  }

  const hasAutomatedCriteria = criteria.length > 0;
  const overall: TriState = hasAutomatedCriteria ? and3(criteria.map((c) => c.result)) : 'UNKNOWN';

  const missing = new Set<string>();
  criteria.forEach((c) => collectMissing(c, missing));

  const summarise = (r: CriterionResult): CriterionSummary => ({
    field: r.field ?? (r.kind === 'group' ? 'group' : 'unknown'),
    label: r.label,
    requirement: r.requirement,
    reason: r.reason,
  });

  return {
    schemeId: String(scheme._id),
    status: STATUS_BY_RESULT[overall],
    criteria,
    passed: criteria.filter((c) => c.result === 'PASS').map(summarise),
    failed: criteria.filter((c) => c.result === 'FAIL').map(summarise),
    unknown: criteria.filter((c) => c.result === 'UNKNOWN').map(summarise),
    missingFields: [...missing],
    additionalChecks: scheme.additionalCriteria ?? [],
    hasAutomatedCriteria,
    evaluatedAt: now.toISOString(),
  };
}

/** Sort rank for recommendation ordering. */
export const STATUS_RANK: Record<EligibilityStatus, number> = {
  LIKELY_ELIGIBLE: 0,
  MORE_INFORMATION_NEEDED: 1,
  NOT_ELIGIBLE: 2,
};
