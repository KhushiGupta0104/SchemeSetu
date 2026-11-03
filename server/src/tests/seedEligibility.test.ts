import { describe, expect, it } from 'vitest';
import { evaluateScheme } from '../services/eligibility/engine.js';
import { realSchemes } from '../seed/data/realSchemes.js';

/**
 * Checks the real seed records against the eligibility engine: missing or withheld profile data
 * must never turn into a "Likely eligible" result, and the rules corrected during the
 * official-source audit (docs/SCHEME_SOURCES.md) behave as the official documents describe.
 */

const NOW = new Date('2026-10-16T06:00:00Z');

const bySlug = (slug: string) => {
  const s = realSchemes.find((x) => x.slug === slug);
  if (!s) throw new Error(`missing seed scheme ${slug}`);
  return { _id: slug, ...s };
};

const statusFor = (slug: string, profile: Record<string, unknown>) => evaluateScheme(bySlug(slug), profile, NOW).status;

describe('real seed schemes and unknown data', () => {
  it('an empty profile is never "Likely eligible" for any real scheme', () => {
    for (const s of realSchemes) {
      const r = evaluateScheme({ _id: s.slug, ...s }, {}, NOW);
      expect(r.status, s.slug).not.toBe('LIKELY_ELIGIBLE');
    }
  });

  it('withheld answers ("prefer not to say" / "not sure") are never treated as a pass', () => {
    const withheld = {
      gender: 'prefer_not_to_say',
      socialCategory: 'prefer_not_to_say',
      disabilityStatus: 'prefer_not_to_say',
      incomeBracket: 'prefer_not_to_say',
      institutionType: 'unknown',
      courseStream: 'unknown',
      occupation: 'prefer_not_to_say',
      employmentStatus: 'prefer_not_to_say',
    };
    for (const s of realSchemes) {
      const r = evaluateScheme({ _id: s.slug, ...s }, withheld, NOW);
      expect(r.status, s.slug).not.toBe('LIKELY_ELIGIBLE');
    }
  });

  it('schemes without machine-checkable rules always need more information', () => {
    const fullProfile = { state: 'Delhi', age: 30, gender: 'male', annualIncome: 100000, employmentStatus: 'self_employed' };
    expect(statusFor('pradhan-mantri-mudra-yojana', fullProfile)).toBe('MORE_INFORMATION_NEEDED');
    expect(statusFor('ayushman-bharat-pm-jay', fullProfile)).toBe('MORE_INFORMATION_NEEDED');
  });
});

describe('rules corrected in the official-source audit', () => {
  it('Ishan Uday: parental income must be below ₹4.5 lakh (exactly ₹4.5 lakh is not eligible)', () => {
    const base = { state: 'Assam', educationLevel: 'undergraduate' };
    expect(statusFor('ishan-uday-north-eastern-region', { ...base, annualIncome: 449999 })).toBe('LIKELY_ELIGIBLE');
    expect(statusFor('ishan-uday-north-eastern-region', { ...base, annualIncome: 450000 })).toBe('NOT_ELIGIBLE');
    expect(statusFor('ishan-uday-north-eastern-region', { ...base, state: 'Bihar', annualIncome: 100000 })).toBe('NOT_ELIGIBLE');
  });

  it('SVMCM: 60% for school/UG, 53% for PG, and no income ceiling for PhD scholars', () => {
    const wb = { state: 'West Bengal', annualIncome: 200000 };
    expect(statusFor('svmcm-west-bengal', { ...wb, educationLevel: 'undergraduate', previousExamPercentage: 60 })).toBe('LIKELY_ELIGIBLE');
    expect(statusFor('svmcm-west-bengal', { ...wb, educationLevel: 'undergraduate', previousExamPercentage: 55 })).toBe('NOT_ELIGIBLE');
    expect(statusFor('svmcm-west-bengal', { ...wb, educationLevel: 'postgraduate', previousExamPercentage: 55 })).toBe('LIKELY_ELIGIBLE');
    expect(statusFor('svmcm-west-bengal', { ...wb, educationLevel: 'postgraduate', previousExamPercentage: 52 })).toBe('NOT_ELIGIBLE');
    expect(statusFor('svmcm-west-bengal', { state: 'West Bengal', educationLevel: 'doctoral', annualIncome: 900000 })).toBe('LIKELY_ELIGIBLE');
    expect(statusFor('svmcm-west-bengal', { ...wb, educationLevel: 'iti', previousExamPercentage: 80 })).toBe('NOT_ELIGIBLE');
  });

  it('SVMCM: a UG student who has not entered marks needs more information', () => {
    expect(statusFor('svmcm-west-bengal', { state: 'West Bengal', annualIncome: 200000, educationLevel: 'undergraduate' })).toBe('MORE_INFORMATION_NEEDED');
  });

  it('Post-matric scholarship for students with disabilities stops at Master\'s level', () => {
    const p = { disabilityStatus: 'benchmark', annualIncome: 200000 };
    expect(statusFor('post-matric-scholarship-students-with-disabilities', { ...p, educationLevel: 'postgraduate' })).toBe('LIKELY_ELIGIBLE');
    expect(statusFor('post-matric-scholarship-students-with-disabilities', { ...p, educationLevel: 'doctoral' })).toBe('NOT_ELIGIBLE');
  });

  it('NMMSS is paid from Class 9 to 12 only', () => {
    const p = { annualIncome: 300000, institutionType: 'government' };
    expect(statusFor('national-means-cum-merit-scholarship', { ...p, educationLevel: 'class_9_10' })).toBe('LIKELY_ELIGIBLE');
    expect(statusFor('national-means-cum-merit-scholarship', { ...p, educationLevel: 'class_1_8' })).toBe('NOT_ELIGIBLE');
  });

  it('AICTE Saksham requires first year (or lateral-entry second year)', () => {
    const p = { disabilityStatus: 'benchmark', courseStream: 'engineering_technical', educationLevel: 'undergraduate', annualIncome: 300000 };
    expect(statusFor('aicte-saksham-scholarship', { ...p, academicYear: 1 })).toBe('LIKELY_ELIGIBLE');
    expect(statusFor('aicte-saksham-scholarship', { ...p, academicYear: 3 })).toBe('NOT_ELIGIBLE');
  });
});
