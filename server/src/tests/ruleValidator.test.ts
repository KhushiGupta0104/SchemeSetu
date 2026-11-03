import { describe, expect, it } from 'vitest';
import { validateRules } from '../services/eligibility/ruleValidator.js';
import { realSchemes } from '../seed/data/realSchemes.js';
import { buildDemoSchemes } from '../seed/data/demoSchemes.js';
import { createSchemeSchema } from '../validators/index.js';

describe('validateRules', () => {
  it('accepts a valid nested rule tree', () => {
    const r = validateRules({
      op: 'all',
      conditions: [
        { field: 'annualIncome', operator: 'lessThanOrEqual', value: 250000 },
        { op: 'any', conditions: [{ field: 'gender', operator: 'equals', value: 'female' }, { field: 'socialCategory', operator: 'in', value: ['sc', 'st'] }] },
      ],
    });
    expect(r.ok).toBe(true);
  });

  it('accepts an empty root group', () => {
    expect(validateRules({ op: 'all', conditions: [] }).ok).toBe(true);
  });

  it.each([
    ['unknown field', { op: 'all', conditions: [{ field: 'shoeSize', operator: 'equals', value: 9 }] }],
    ['operator not allowed for type', { op: 'all', conditions: [{ field: 'gender', operator: 'greaterThan', value: 3 }] }],
    ['invalid enum value', { op: 'all', conditions: [{ field: 'gender', operator: 'equals', value: 'robot' }] }],
    ['non-numeric value for number field', { op: 'all', conditions: [{ field: 'age', operator: 'lessThan', value: '30' }] }],
    ['out-of-range number', { op: 'all', conditions: [{ field: 'previousExamPercentage', operator: 'greaterThan', value: 150 }] }],
    ['empty in-list', { op: 'all', conditions: [{ field: 'state', operator: 'in', value: [] }] }],
    ['undisclosed value used as a requirement', { op: 'all', conditions: [{ field: 'gender', operator: 'equals', value: 'prefer_not_to_say' }] }],
    ['empty nested group', { op: 'all', conditions: [{ op: 'any', conditions: [] }] }],
    ['bad group operator', { op: 'xor', conditions: [] }],
    ['extra properties (e.g. code injection attempts)', { op: 'all', conditions: [{ field: 'age', operator: 'lessThan', value: 30, $where: 'sleep(1000)' }] }],
    ['too deep', { op: 'all', conditions: [{ op: 'all', conditions: [{ op: 'all', conditions: [{ op: 'all', conditions: [{ op: 'all', conditions: [{ field: 'age', operator: 'exists' }] }] }] }] }] }],
    ['not an object', 'age < 30'],
  ])('rejects %s', (_label, rules) => {
    expect(validateRules(rules).ok).toBe(false);
  });
});

describe('seed data integrity', () => {
  it('every real scheme passes the admin validation rules', () => {
    for (const s of realSchemes) {
      const r = createSchemeSchema.safeParse({ ...s, sourceVerifiedAt: s.sourceVerifiedAt ?? null, publicationStatus: 'published' });
      expect(r.success, `${s.slug}: ${r.success ? '' : JSON.stringify(r.error.issues)}`).toBe(true);
    }
  });

  it('only verified records carry a verification date, deadline or open window, and each names its source', () => {
    for (const s of realSchemes) {
      const status = s.verificationStatus ?? 'needs_review';
      expect(['verified', 'needs_review'], s.slug).toContain(status);
      expect(s.isDemo ?? false).toBe(false);
      if (status === 'verified') {
        expect(s.sourceVerifiedAt, s.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(s.verificationNotes, s.slug).toMatch(/^Verified on \d{4}-\d{2}-\d{2} against /);
        expect(s.officialSourceUrl, s.slug).toMatch(/^https:\/\//);
      } else {
        expect(s.sourceVerifiedAt ?? null, s.slug).toBeNull();
        expect(s.applicationDeadline ?? null, s.slug).toBeNull();
        expect(s.applicationWindowStatus ?? 'not_verified', s.slug).toBe('not_verified');
        expect(s.verificationNotes, s.slug).toMatch(/^Not verified/);
      }
    }
  });

  it('slugs are unique and demo records are clearly labelled', () => {
    const demo = buildDemoSchemes();
    const slugs = [...realSchemes, ...demo].map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const d of demo) {
      expect(d.isDemo).toBe(true);
      expect(d.name.startsWith('[DEMO]')).toBe(true);
      expect(d.officialSourceUrl).toContain('example.org');
    }
  });
});
