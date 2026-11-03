/**
 * DEMO SCHEMES — clearly hypothetical records used only to demonstrate features such as the
 * deadline tracker and status labels. They are NOT real schemes, are flagged isDemo = true,
 * carry verificationStatus "demo", point to example.org, and are shown with a "Demo" label.
 * Deadlines are generated relative to the seeding date so the demo always has upcoming dates.
 */
import { addDays, todayIST } from '../../utils/dates.js';
import type { SeedScheme } from './realSchemes.js';

const iso = (offsetDays: number) => addDays(todayIST(), offsetDays).toISOString().slice(0, 10);

const DEMO_NOTE = 'Hypothetical demonstration record created for SchemeSetu. This is not a real scheme.';
const DEMO_URL = 'https://example.org/schemesetu-demo';

const demoDocs = [
  { docId: 'identity-proof', name: 'Identity proof' },
  { docId: 'income-certificate', name: 'Family income certificate' },
  { docId: 'previous-marksheet', name: 'Marksheet of the last qualifying examination' },
  { docId: 'admission-proof', name: 'Proof of admission' },
];

const steps = [
  'This is a demo record — there is no real application process.',
  'Use it to try saving, tracking, the document checklist and the deadline tracker.',
];

export function buildDemoSchemes(): SeedScheme[] {
  return [
    {
      name: '[DEMO] Sample State Merit Scholarship for Undergraduates',
      slug: 'demo-sample-state-merit-scholarship',
      shortDescription: 'Hypothetical scholarship used to demonstrate income-bracket handling and deadlines. Not a real scheme.',
      description: `${DEMO_NOTE} It imagines a state scholarship for undergraduate students with marks of at least 60% and family income up to ₹3,00,000 in Karnataka.`,
      category: 'education',
      tags: ['demo', 'undergraduate', 'merit'],
      provider: 'SchemeSetu Demo Data',
      providerType: 'state_government',
      isAllIndia: false,
      applicableStates: ['Karnataka'],
      educationLevels: ['undergraduate'],
      benefitType: 'scholarship',
      benefitSummary: 'Hypothetical annual scholarship (demo only).',
      benefits: ['Demo benefit — not real.'],
      eligibilityRules: {
        op: 'all',
        conditions: [
          { field: 'annualIncome', operator: 'lessThanOrEqual', value: 300000 },
          { field: 'educationLevel', operator: 'in', value: ['undergraduate'] },
          { field: 'previousExamPercentage', operator: 'greaterThanOrEqual', value: 60 },
        ],
      },
      additionalCriteria: [],
      requiredDocuments: demoDocs,
      applicationSteps: steps,
      officialSourceUrl: DEMO_URL,
      applicationUrl: null,
      verificationNotes: DEMO_NOTE,
      applicationOpenDate: iso(-20),
      applicationDeadline: iso(9),
      applicationWindowStatus: 'open',
      verificationStatus: 'demo',
      isDemo: true,
    },
    {
      name: '[DEMO] Sample Women in STEM Fellowship',
      slug: 'demo-sample-women-in-stem-fellowship',
      shortDescription: 'Hypothetical fellowship for women in technical courses, used to demonstrate deadlines. Not a real scheme.',
      description: `${DEMO_NOTE} It imagines a nationwide fellowship for women in engineering or medical courses.`,
      category: 'women_empowerment',
      tags: ['demo', 'women', 'STEM'],
      provider: 'SchemeSetu Demo Data',
      providerType: 'private',
      isAllIndia: true,
      educationLevels: ['undergraduate', 'postgraduate'],
      benefitType: 'stipend',
      benefitSummary: 'Hypothetical monthly stipend (demo only).',
      benefits: ['Demo benefit — not real.'],
      eligibilityRules: {
        op: 'all',
        conditions: [
          { field: 'gender', operator: 'equals', value: 'female' },
          {
            op: 'any',
            conditions: [
              { field: 'courseStream', operator: 'equals', value: 'engineering_technical' },
              { field: 'courseStream', operator: 'equals', value: 'medical_health' },
            ],
          },
        ],
      },
      additionalCriteria: [],
      requiredDocuments: demoDocs,
      applicationSteps: steps,
      officialSourceUrl: DEMO_URL,
      applicationUrl: null,
      verificationNotes: DEMO_NOTE,
      applicationOpenDate: iso(-5),
      applicationDeadline: iso(30),
      applicationWindowStatus: 'open',
      verificationStatus: 'demo',
      isDemo: true,
    },
    {
      name: '[DEMO] Sample Skill Training Allowance',
      slug: 'demo-sample-skill-training-allowance',
      shortDescription: 'Hypothetical training allowance for job seekers aged 18–30, used for demos. Not a real scheme.',
      description: `${DEMO_NOTE} It imagines a training allowance for unemployed young people.`,
      category: 'employment_skills',
      tags: ['demo', 'skills', 'job seekers'],
      provider: 'SchemeSetu Demo Data',
      providerType: 'central_government',
      isAllIndia: true,
      educationLevels: [],
      benefitType: 'training',
      benefitSummary: 'Hypothetical training with allowance (demo only).',
      benefits: ['Demo benefit — not real.'],
      eligibilityRules: {
        op: 'all',
        conditions: [
          { field: 'age', operator: 'greaterThanOrEqual', value: 18 },
          { field: 'age', operator: 'lessThanOrEqual', value: 30 },
          { field: 'employmentStatus', operator: 'equals', value: 'unemployed' },
        ],
      },
      additionalCriteria: [],
      requiredDocuments: demoDocs.slice(0, 2),
      applicationSteps: steps,
      officialSourceUrl: DEMO_URL,
      applicationUrl: null,
      verificationNotes: DEMO_NOTE,
      applicationOpenDate: iso(10),
      applicationDeadline: iso(60),
      applicationWindowStatus: 'upcoming',
      verificationStatus: 'demo',
      isDemo: true,
    },
    {
      name: '[DEMO] Sample Expired Hostel Grant',
      slug: 'demo-sample-expired-hostel-grant',
      shortDescription: 'Hypothetical grant whose deadline has passed, used to demonstrate expired deadlines. Not a real scheme.',
      description: `${DEMO_NOTE} It shows how SchemeSetu labels a scheme whose deadline is over.`,
      category: 'financial_assistance',
      tags: ['demo', 'hostel'],
      provider: 'SchemeSetu Demo Data',
      providerType: 'state_government',
      isAllIndia: true,
      educationLevels: [],
      benefitType: 'cash_transfer',
      benefitSummary: 'Hypothetical one-time grant (demo only).',
      benefits: ['Demo benefit — not real.'],
      eligibilityRules: { op: 'all', conditions: [{ field: 'annualIncome', operator: 'lessThanOrEqual', value: 300000 }] },
      additionalCriteria: [],
      requiredDocuments: demoDocs.slice(0, 2),
      applicationSteps: steps,
      officialSourceUrl: DEMO_URL,
      applicationUrl: null,
      verificationNotes: DEMO_NOTE,
      applicationOpenDate: iso(-60),
      applicationDeadline: iso(-12),
      applicationWindowStatus: 'closed',
      verificationStatus: 'demo',
      isDemo: true,
    },
  ];
}

/** Demo student profile — fictional, contains no real personal data. */
export const DEMO_STUDENT = {
  name: 'Demo Student',
  email: 'student@demo.schemesetu.local',
  profile: {
    age: 19,
    state: 'Karnataka',
    gender: 'female',
    residenceType: 'urban',
    educationLevel: 'undergraduate',
    course: 'B.Tech Computer Science',
    courseStream: 'engineering_technical',
    institutionType: 'government',
    academicYear: 1,
    previousExamPercentage: 86,
    incomeBracket: '1l_2l',
    socialCategory: 'prefer_not_to_say',
    minorityCommunity: 'prefer_not_to_say',
    disabilityStatus: 'none',
    employmentStatus: 'student',
    occupation: 'none',
  },
};
