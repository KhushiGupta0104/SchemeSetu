import { FIELD_MAP, OPERATORS_BY_TYPE, type Operator } from '../../constants/options.js';
import type { RuleCondition, RuleGroup, RuleNode } from './types.js';

/** Root group plus up to three levels of nested groups. */
export const MAX_RULE_DEPTH = 4;
export const MAX_CONDITIONS_PER_GROUP = 30;

export interface RuleIssue {
  path: string;
  message: string;
}

const NUMBER_LIMITS: Record<string, [number, number]> = {
  age: [0, 120],
  annualIncome: [0, 100_000_000],
  academicYear: [1, 10],
  previousExamPercentage: [0, 100],
};

export function isGroup(node: unknown): node is RuleGroup {
  return typeof node === 'object' && node !== null && 'op' in node && 'conditions' in node;
}

function validateCondition(node: Record<string, unknown>, path: string, issues: RuleIssue[]) {
  const allowedKeys = new Set(['id', 'field', 'operator', 'value']);
  for (const k of Object.keys(node)) {
    if (!allowedKeys.has(k)) issues.push({ path, message: `Unexpected property "${k}".` });
  }
  if (node.id !== undefined && (typeof node.id !== 'string' || node.id.length > 64)) {
    issues.push({ path: `${path}.id`, message: 'Condition id must be a short string.' });
  }
  const field = typeof node.field === 'string' ? FIELD_MAP[node.field] : undefined;
  if (!field) {
    issues.push({ path: `${path}.field`, message: `Unknown field "${String(node.field)}".` });
    return;
  }
  const op = node.operator as Operator;
  if (!OPERATORS_BY_TYPE[field.type].includes(op)) {
    issues.push({
      path: `${path}.operator`,
      message: `Operator "${String(node.operator)}" cannot be used with ${field.label}.`,
    });
    return;
  }
  const value = node.value;

  if (op === 'exists') {
    if (value !== undefined && value !== null && value !== true) {
      issues.push({ path: `${path}.value`, message: '"is provided" does not take a value.' });
    }
    return;
  }

  if (field.type === 'enum') {
    const allowed = new Set((field.options ?? []).map((o) => o.value));
    allowed.delete('prefer_not_to_say');
    allowed.delete('unknown');
    if (op === 'in' || op === 'notIn') {
      if (!Array.isArray(value) || value.length === 0) {
        issues.push({ path: `${path}.value`, message: 'Choose at least one value.' });
        return;
      }
      if (new Set(value).size !== value.length) {
        issues.push({ path: `${path}.value`, message: 'Values must not repeat.' });
      }
      value.forEach((v, i) => {
        if (typeof v !== 'string' || !allowed.has(v)) {
          issues.push({ path: `${path}.value[${i}]`, message: `"${String(v)}" is not a valid ${field.label} value.` });
        }
      });
    } else if (typeof value !== 'string' || !allowed.has(value)) {
      issues.push({ path: `${path}.value`, message: `Choose a valid ${field.label} value.` });
    }
    return;
  }

  // number field
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    issues.push({ path: `${path}.value`, message: `${field.label} requires a numeric value.` });
    return;
  }
  const [lo, hi] = NUMBER_LIMITS[field.key] ?? [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY];
  if (value < lo || value > hi) {
    issues.push({ path: `${path}.value`, message: `${field.label} must be between ${lo} and ${hi}.` });
  }
}

function validateNode(node: unknown, path: string, depth: number, issues: RuleIssue[]) {
  if (typeof node !== 'object' || node === null || Array.isArray(node)) {
    issues.push({ path, message: 'Each rule must be a condition or a group.' });
    return;
  }
  if (isGroup(node)) {
    const g = node as unknown as Record<string, unknown>;
    for (const k of Object.keys(g)) {
      if (k !== 'op' && k !== 'conditions') issues.push({ path, message: `Unexpected property "${k}".` });
    }
    if (g.op !== 'all' && g.op !== 'any') {
      issues.push({ path: `${path}.op`, message: 'Group type must be "all" (AND) or "any" (OR).' });
    }
    if (depth > MAX_RULE_DEPTH) {
      issues.push({ path, message: `Groups can be nested at most ${MAX_RULE_DEPTH} levels deep.` });
      return;
    }
    if (!Array.isArray(g.conditions)) {
      issues.push({ path: `${path}.conditions`, message: 'Group conditions must be a list.' });
      return;
    }
    // The root group may be empty (scheme without machine-checkable criteria); nested groups may not.
    if (depth > 1 && g.conditions.length === 0) {
      issues.push({ path: `${path}.conditions`, message: 'A group must contain at least one condition.' });
    }
    if (g.conditions.length > MAX_CONDITIONS_PER_GROUP) {
      issues.push({ path: `${path}.conditions`, message: `A group can have at most ${MAX_CONDITIONS_PER_GROUP} conditions.` });
    }
    g.conditions.forEach((c, i) => validateNode(c, `${path}.conditions[${i}]`, depth + 1, issues));
    return;
  }
  validateCondition(node as Record<string, unknown>, path, issues);
}

/**
 * Validates an eligibility rule tree. Rules are plain data — they are interpreted by the
 * engine and never executed as code (no eval, no dynamic functions).
 */
export function validateRules(rules: unknown): { ok: true; value: RuleGroup } | { ok: false; issues: RuleIssue[] } {
  const issues: RuleIssue[] = [];
  if (!isGroup(rules)) {
    return { ok: false, issues: [{ path: 'eligibilityRules', message: 'Rules must be a group with "op" and "conditions".' }] };
  }
  validateNode(rules, 'eligibilityRules', 1, issues);
  return issues.length ? { ok: false, issues } : { ok: true, value: rules as RuleGroup };
}

export type { RuleCondition, RuleNode };
