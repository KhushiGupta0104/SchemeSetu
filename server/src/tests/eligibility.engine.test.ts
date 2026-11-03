import { describe, expect, it } from 'vitest';
import { and3, compareRange, evaluateScheme, or3 } from '../services/eligibility/engine.js';
import { buildFacts } from '../services/eligibility/facts.js';
import type { RuleGroup } from '../services/eligibility/types.js';

const NOW = new Date('2026-10-15T06:00:00Z');

const scheme = (eligibilityRules: unknown, extra: Record<string, unknown> = {}) => ({
  _id: 'scheme-1',
  isAllIndia: true,
  applicableStates: [] as string[],
  eligibilityRules,
  ...extra,
});

const rules = (...conditions: RuleGroup['conditions']): RuleGroup => ({ op: 'all', conditions });

const baseProfile = {
  state: 'Karnataka',
  educationLevel: 'undergraduate',
  annualIncome: 180000,
  gender: 'female',
  age: 20,
};

describe('three-valued logic', () => {
  it('AND: any FAIL -> FAIL, all PASS -> PASS, otherwise UNKNOWN', () => {
    expect(and3(['PASS', 'PASS'])).toBe('PASS');
    expect(and3(['PASS', 'FAIL', 'UNKNOWN'])).toBe('FAIL');
    expect(and3(['PASS', 'UNKNOWN'])).toBe('UNKNOWN');
    expect(and3([])).toBe('PASS');
  });
  it('OR: any PASS -> PASS, all FAIL -> FAIL, otherwise UNKNOWN', () => {
    expect(or3(['FAIL', 'PASS'])).toBe('PASS');
    expect(or3(['FAIL', 'FAIL'])).toBe('FAIL');
    expect(or3(['FAIL', 'UNKNOWN'])).toBe('UNKNOWN');
    expect(or3([])).toBe('FAIL');
  });
});

describe('interval comparison', () => {
  it('handles exact values and boundaries', () => {
    expect(compareRange(250000, 250000, 'lessThanOrEqual', 250000)).toBe('PASS');
    expect(compareRange(250001, 250001, 'lessThanOrEqual', 250000)).toBe('FAIL');
    expect(compareRange(250000, 250000, 'lessThan', 250000)).toBe('FAIL');
    expect(compareRange(18, 18, 'greaterThanOrEqual', 18)).toBe('PASS');
    expect(compareRange(18, 18, 'greaterThan', 18)).toBe('FAIL');
  });
  it('returns UNKNOWN when a threshold falls inside a bracket', () => {
    expect(compareRange(100001, 300000, 'lessThanOrEqual', 250000)).toBe('UNKNOWN');
    expect(compareRange(100001, 200000, 'lessThanOrEqual', 250000)).toBe('PASS');
    expect(compareRange(300001, 400000, 'lessThanOrEqual', 250000)).toBe('FAIL');
    expect(compareRange(100001, 300000, 'equals', 150000)).toBe('UNKNOWN');
  });
});

describe('evaluateScheme', () => {
  const standard = rules(
    { field: 'annualIncome', operator: 'lessThanOrEqual', value: 250000 },
    { field: 'educationLevel', operator: 'in', value: ['undergraduate'] },
    { field: 'gender', operator: 'equals', value: 'female' },
  );

  it('returns LIKELY_ELIGIBLE when all conditions pass', () => {
    const r = evaluateScheme(scheme(standard), baseProfile, NOW);
    expect(r.status).toBe('LIKELY_ELIGIBLE');
    expect(r.passed).toHaveLength(3);
    expect(r.failed).toHaveLength(0);
    expect(r.unknown).toHaveLength(0);
    expect(r.evaluatedAt).toBe(NOW.toISOString());
    expect(r.schemeId).toBe('scheme-1');
  });

  it('returns NOT_ELIGIBLE when one mandatory condition fails', () => {
    const r = evaluateScheme(scheme(standard), { ...baseProfile, gender: 'male' }, NOW);
    expect(r.status).toBe('NOT_ELIGIBLE');
    expect(r.failed.map((f) => f.field)).toEqual(['gender']);
    expect(r.failed[0].reason).toMatch(/does not meet/);
  });

  it('FAIL beats UNKNOWN', () => {
    const r = evaluateScheme(scheme(standard), { gender: 'male' }, NOW);
    expect(r.status).toBe('NOT_ELIGIBLE');
  });

  it('missing required field gives MORE_INFORMATION_NEEDED, never FAIL', () => {
    const { annualIncome: _omit, ...noIncome } = baseProfile;
    const r = evaluateScheme(scheme(standard), noIncome, NOW);
    expect(r.status).toBe('MORE_INFORMATION_NEEDED');
    expect(r.unknown.map((u) => u.field)).toEqual(['annualIncome']);
    expect(r.missingFields).toEqual(['annualIncome']);
  });

  it('"prefer not to say" is treated as unknown, not disqualifying', () => {
    const r = evaluateScheme(
      scheme(rules({ field: 'socialCategory', operator: 'in', value: ['sc', 'st'] })),
      { socialCategory: 'prefer_not_to_say' },
      NOW,
    );
    expect(r.status).toBe('MORE_INFORMATION_NEEDED');
    expect(r.unknown[0].reason).toMatch(/chose not to share/);
  });

  it('income bracket crossing the threshold gives MORE_INFORMATION_NEEDED (no midpoint guessing)', () => {
    const r = evaluateScheme(
      scheme(rules({ field: 'annualIncome', operator: 'lessThanOrEqual', value: 300000 })),
      { incomeBracket: '2_5l_3_5l' }, // ₹2,50,001 – ₹3,50,000
      NOW,
    );
    expect(r.status).toBe('MORE_INFORMATION_NEEDED');
    expect(r.unknown[0].reason).toMatch(/spans this limit/);
    expect(r.missingFields).toContain('annualIncome');
  });

  it('income bracket entirely below / above the threshold resolves', () => {
    const rule = scheme(rules({ field: 'annualIncome', operator: 'lessThanOrEqual', value: 250000 }));
    expect(evaluateScheme(rule, { incomeBracket: '2l_2_5l' }, NOW).status).toBe('LIKELY_ELIGIBLE');
    expect(evaluateScheme(rule, { incomeBracket: '2_5l_3_5l' }, NOW).status).toBe('NOT_ELIGIBLE');
    expect(evaluateScheme(rule, { incomeBracket: 'above_12l' }, NOW).status).toBe('NOT_ELIGIBLE');
  });

  it('an exact income overrides the bracket', () => {
    const rule = scheme(rules({ field: 'annualIncome', operator: 'lessThanOrEqual', value: 300000 }));
    expect(evaluateScheme(rule, { incomeBracket: '2_5l_3_5l', annualIncome: 280000 }, NOW).status).toBe('LIKELY_ELIGIBLE');
  });

  it('OR group passes when any condition passes', () => {
    const r = evaluateScheme(
      scheme(rules({ op: 'any', conditions: [
        { field: 'socialCategory', operator: 'in', value: ['sc', 'st'] },
        { field: 'gender', operator: 'equals', value: 'female' },
      ] })),
      { socialCategory: 'general', gender: 'female' },
      NOW,
    );
    expect(r.status).toBe('LIKELY_ELIGIBLE');
    expect(r.criteria[0].kind).toBe('group');
  });

  it('OR group fails only when every condition fails', () => {
    const rule = scheme(rules({ op: 'any', conditions: [
      { field: 'socialCategory', operator: 'in', value: ['sc', 'st'] },
      { field: 'gender', operator: 'equals', value: 'female' },
    ] }));
    expect(evaluateScheme(rule, { socialCategory: 'general', gender: 'male' }, NOW).status).toBe('NOT_ELIGIBLE');
    expect(evaluateScheme(rule, { gender: 'male' }, NOW).status).toBe('MORE_INFORMATION_NEEDED');
  });

  it('root OR group is evaluated as a single criterion', () => {
    const r = evaluateScheme(
      scheme({ op: 'any', conditions: [{ field: 'age', operator: 'greaterThanOrEqual', value: 60 }, { field: 'disabilityStatus', operator: 'equals', value: 'benchmark' }] }),
      { age: 30, disabilityStatus: 'benchmark' },
      NOW,
    );
    expect(r.status).toBe('LIKELY_ELIGIBLE');
    expect(r.criteria).toHaveLength(1);
  });

  it('evaluates nested groups (age 15–35, or up to 45 for women / SC / ST)', () => {
    const nested = scheme(rules(
      { field: 'age', operator: 'greaterThanOrEqual', value: 15 },
      { op: 'any', conditions: [
        { field: 'age', operator: 'lessThanOrEqual', value: 35 },
        { op: 'all', conditions: [
          { field: 'age', operator: 'lessThanOrEqual', value: 45 },
          { op: 'any', conditions: [
            { field: 'gender', operator: 'equals', value: 'female' },
            { field: 'socialCategory', operator: 'in', value: ['sc', 'st'] },
          ] },
        ] },
      ] },
    ));
    expect(evaluateScheme(nested, { age: 25 }, NOW).status).toBe('LIKELY_ELIGIBLE');
    expect(evaluateScheme(nested, { age: 40, gender: 'female' }, NOW).status).toBe('LIKELY_ELIGIBLE');
    expect(evaluateScheme(nested, { age: 40, gender: 'male', socialCategory: 'general' }, NOW).status).toBe('NOT_ELIGIBLE');
    expect(evaluateScheme(nested, { age: 40, gender: 'male' }, NOW).status).toBe('MORE_INFORMATION_NEEDED');
    expect(evaluateScheme(nested, { age: 50, gender: 'female' }, NOW).status).toBe('NOT_ELIGIBLE');
  });

  it('a scheme with no machine-checkable rules never shows a fake match', () => {
    const r = evaluateScheme(scheme({ op: 'all', conditions: [] }), baseProfile, NOW);
    expect(r.status).toBe('MORE_INFORMATION_NEEDED');
    expect(r.hasAutomatedCriteria).toBe(false);
  });

  it('an empty nested group behaves as its logical identity (AND=PASS, OR=FAIL)', () => {
    expect(evaluateScheme(scheme(rules({ op: 'all', conditions: [] })), {}, NOW).status).toBe('LIKELY_ELIGIBLE');
    expect(evaluateScheme(scheme(rules({ op: 'any', conditions: [] })), {}, NOW).status).toBe('NOT_ELIGIBLE');
  });

  it('malformed rules are reported as UNKNOWN instead of crashing', () => {
    const malformed = scheme(rules(
      { field: 'shoeSize', operator: 'equals', value: 9 } as never,
      { field: 'age', operator: 'in', value: 5 } as never,
      { field: 'annualIncome', operator: 'lessThanOrEqual', value: 'lots' } as never,
    ));
    const r = evaluateScheme(malformed, baseProfile, NOW);
    expect(r.status).toBe('MORE_INFORMATION_NEEDED');
    expect(r.unknown).toHaveLength(3);
    expect(evaluateScheme(scheme('not a rule tree'), baseProfile, NOW).status).toBe('MORE_INFORMATION_NEEDED');
    expect(evaluateScheme(scheme(rules(null as never)), baseProfile, NOW).status).toBe('MORE_INFORMATION_NEEDED');
  });

  it('applies state applicability for state-specific schemes', () => {
    const s = scheme(rules(), { isAllIndia: false, applicableStates: ['West Bengal'] });
    const pass = evaluateScheme(s, { state: 'West Bengal' }, NOW);
    expect(pass.status).toBe('LIKELY_ELIGIBLE');
    expect(pass.criteria[0].source).toBe('geography');
    expect(evaluateScheme(s, { state: 'Kerala' }, NOW).status).toBe('NOT_ELIGIBLE');
    expect(evaluateScheme(s, {}, NOW).status).toBe('MORE_INFORMATION_NEEDED');
  });

  it('all-India schemes do not check state', () => {
    const r = evaluateScheme(scheme(rules({ field: 'gender', operator: 'equals', value: 'female' })), { gender: 'female' }, NOW);
    expect(r.criteria.some((c) => c.source === 'geography')).toBe(false);
    expect(r.status).toBe('LIKELY_ELIGIBLE');
  });

  it('boundary values: inclusive and exclusive limits', () => {
    const lte = scheme(rules({ field: 'annualIncome', operator: 'lessThanOrEqual', value: 250000 }));
    expect(evaluateScheme(lte, { annualIncome: 250000 }, NOW).status).toBe('LIKELY_ELIGIBLE');
    expect(evaluateScheme(lte, { annualIncome: 250001 }, NOW).status).toBe('NOT_ELIGIBLE');
    const ageRange = scheme(rules(
      { field: 'age', operator: 'greaterThanOrEqual', value: 21 },
      { field: 'age', operator: 'lessThanOrEqual', value: 24 },
    ));
    expect(evaluateScheme(ageRange, { age: 21 }, NOW).status).toBe('LIKELY_ELIGIBLE');
    expect(evaluateScheme(ageRange, { age: 24 }, NOW).status).toBe('LIKELY_ELIGIBLE');
    expect(evaluateScheme(ageRange, { age: 20 }, NOW).status).toBe('NOT_ELIGIBLE');
    expect(evaluateScheme(ageRange, { age: 25 }, NOW).status).toBe('NOT_ELIGIBLE');
  });

  it('computes age from date of birth in IST (birthday boundary)', () => {
    const r = scheme(rules({ field: 'age', operator: 'greaterThanOrEqual', value: 18 }));
    // 2026-10-15 in IST: born 2008-10-15 turns 18 today; born 2008-10-16 is still 17.
    expect(evaluateScheme(r, { dateOfBirth: '2008-10-15' }, NOW).status).toBe('LIKELY_ELIGIBLE');
    expect(evaluateScheme(r, { dateOfBirth: '2008-10-16' }, NOW).status).toBe('NOT_ELIGIBLE');
  });

  it('reflects changes to the user profile', () => {
    const s = scheme(standard);
    expect(evaluateScheme(s, { ...baseProfile, annualIncome: 400000 }, NOW).status).toBe('NOT_ELIGIBLE');
    expect(evaluateScheme(s, { ...baseProfile, annualIncome: 200000 }, NOW).status).toBe('LIKELY_ELIGIBLE');
  });

  it('reflects changes to scheme rules', () => {
    const before = scheme(rules({ field: 'annualIncome', operator: 'lessThanOrEqual', value: 150000 }));
    const after = scheme(rules({ field: 'annualIncome', operator: 'lessThanOrEqual', value: 200000 }));
    expect(evaluateScheme(before, baseProfile, NOW).status).toBe('NOT_ELIGIBLE');
    expect(evaluateScheme(after, baseProfile, NOW).status).toBe('LIKELY_ELIGIBLE');
  });

  it('notIn / notEquals / exists operators', () => {
    expect(evaluateScheme(scheme(rules({ field: 'employmentStatus', operator: 'notEquals', value: 'employed' })), { employmentStatus: 'unemployed' }, NOW).status).toBe('LIKELY_ELIGIBLE');
    expect(evaluateScheme(scheme(rules({ field: 'occupation', operator: 'notIn', value: ['farmer'] })), { occupation: 'farmer' }, NOW).status).toBe('NOT_ELIGIBLE');
    expect(evaluateScheme(scheme(rules({ field: 'state', operator: 'exists' })), { state: 'Goa' }, NOW).status).toBe('LIKELY_ELIGIBLE');
    expect(evaluateScheme(scheme(rules({ field: 'state', operator: 'exists' })), {}, NOW).status).toBe('MORE_INFORMATION_NEEDED');
  });

  it('lists additional (non-automated) criteria', () => {
    const r = evaluateScheme(scheme(standard, { additionalCriteria: ['Must be unmarried'] }), baseProfile, NOW);
    expect(r.additionalChecks).toEqual(['Must be unmarried']);
  });
});

describe('buildFacts', () => {
  it('maps withheld and missing data to missing facts', () => {
    const f = buildFacts({ incomeBracket: 'prefer_not_to_say', gender: 'prefer_not_to_say' }, NOW);
    expect(f.annualIncome).toEqual({ kind: 'missing', reason: 'withheld' });
    expect(f.gender).toEqual({ kind: 'missing', reason: 'withheld' });
    expect(f.state).toEqual({ kind: 'missing', reason: 'not_provided' });
  });
  it('treats the open-ended top bracket as unbounded', () => {
    const f = buildFacts({ incomeBracket: 'above_12l' }, NOW);
    expect(f.annualIncome).toMatchObject({ kind: 'range', min: 1200001, max: Infinity });
  });
});
