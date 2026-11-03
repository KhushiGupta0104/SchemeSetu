/**
 * REAL SCHEME RECORDS — existing Indian government schemes.
 *
 * DATA-INTEGRITY NOTES (audit of 2026-10-16, see docs/SCHEME_SOURCES.md)
 * - A record is marked verificationStatus "verified" (with sourceVerifiedAt) ONLY when its
 *   eligibility conditions, income limit, benefits and application route were checked against an
 *   official government / provider document. Its verificationNotes name that document.
 * - Records whose official source could not be reached or did not state the facts are left as
 *   "needs_review" with sourceVerifiedAt = null. Their notes say what is and is not confirmed.
 * - Dates and an "open" window are set only where the official portal states them (the National
 *   Scholarship Portal's AY 2026-27 scheme list). Once a deadline passes the app shows
 *   "deadline passed" automatically. Every other record keeps deadline = null / "not_verified".
 * - Conditions that SchemeSetu cannot check from a profile are listed in additionalCriteria and
 *   shown to users as "check this yourself". Missing profile data never counts as a pass.
 */
import type { RuleGroup } from '../../services/eligibility/types.js';

export interface SeedScheme {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: string;
  tags: string[];
  provider: string;
  providerType: string;
  isAllIndia: boolean;
  applicableStates?: string[];
  educationLevels?: string[];
  benefitType: string;
  benefitSummary: string;
  benefits: string[];
  eligibilityRules: RuleGroup;
  additionalCriteria: string[];
  requiredDocuments: Array<{ docId: string; name: string; description?: string; optional?: boolean }>;
  applicationSteps: string[];
  officialSourceUrl: string;
  applicationUrl: string | null;
  verificationNotes: string;
  applicationOpenDate?: string | null;
  applicationDeadline?: string | null;
  applicationWindowStatus?: string;
  verificationStatus?: string;
  sourceVerifiedAt?: string | null;
  isDemo?: boolean;
}

// ---------- shared building blocks ----------

const POST_MATRIC = ['class_11_12', 'iti', 'diploma', 'undergraduate', 'postgraduate', 'doctoral'];
const NE_STATES = ['Arunachal Pradesh', 'Assam', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Sikkim', 'Tripura'];

const all = (...conditions: RuleGroup['conditions']): RuleGroup => ({ op: 'all', conditions });
const any = (...conditions: RuleGroup['conditions']): RuleGroup => ({ op: 'any', conditions });
const incomeAtMost = (n: number) => ({ field: 'annualIncome', operator: 'lessThanOrEqual' as const, value: n });
const incomeBelow = (n: number) => ({ field: 'annualIncome', operator: 'lessThan' as const, value: n });
const marksAtLeast = (n: number) => ({ field: 'previousExamPercentage', operator: 'greaterThanOrEqual' as const, value: n });
const isIn = (field: string, value: string[]) => ({ field, operator: 'in' as const, value });
const eq = (field: string, value: string) => ({ field, operator: 'equals' as const, value });
const ageAtLeast = (n: number) => ({ field: 'age', operator: 'greaterThanOrEqual' as const, value: n });
const ageAtMost = (n: number) => ({ field: 'age', operator: 'lessThanOrEqual' as const, value: n });

const DOC = {
  identity: { docId: 'identity-proof', name: 'Identity proof', description: 'As accepted by the application portal.' },
  income: { docId: 'income-certificate', name: 'Family income certificate', description: 'Issued by a competent authority, for the period the scheme specifies.' },
  caste: { docId: 'caste-certificate', name: 'Caste / community certificate', description: 'Issued by a competent authority.' },
  domicile: { docId: 'domicile-certificate', name: 'Domicile / residence certificate' },
  marksheet: { docId: 'previous-marksheet', name: 'Marksheet of the last qualifying examination' },
  admission: { docId: 'admission-proof', name: 'Proof of admission / bonafide student certificate' },
  fee: { docId: 'fee-receipt', name: 'Fee receipt or fee structure from the institution', optional: true },
  bank: { docId: 'bank-account', name: 'Bank account details in the applicant\'s name', description: 'Usually needs to be linked as required by the portal for direct benefit transfer.' },
  photo: { docId: 'photograph', name: 'Recent passport-size photograph' },
  disability: { docId: 'disability-certificate', name: 'Disability certificate / UDID', description: 'Showing the percentage of disability, issued by a competent medical authority.' },
};

const NSP_STEPS = [
  'Register on the National Scholarship Portal (scholarships.gov.in) during the open application window.',
  'Log in, fill the application form for this scheme and upload the documents requested.',
  'Submit the application and keep the application ID for reference.',
  'Your institution and the state/central nodal authority verify the application online.',
  'Track the status on the portal; approved scholarships are paid by direct benefit transfer.',
];

// ---------- verification helpers ----------

/** Date of the official-source audit recorded in docs/SCHEME_SOURCES.md. */
const AUDIT_DATE = '2026-10-16';

/** A record checked against an official document on the audit date. */
const verified = (note: string) => ({
  verificationStatus: 'verified',
  sourceVerifiedAt: AUDIT_DATE,
  verificationNotes: `Verified on ${AUDIT_DATE} against ${note}`,
});

/** A record that could not be fully confirmed from an official source. */
const needsReview = (note: string) => ({
  verificationStatus: 'needs_review',
  sourceVerifiedAt: null,
  verificationNotes: `Not verified (audit of ${AUDIT_DATE}): ${note}`,
});

/** AY 2026-27 window exactly as listed on scholarships.gov.in/All-Scholarships (checked on the audit date). */
const NSP_2026_27 = (openDate: string) => ({
  applicationOpenDate: openDate,
  applicationDeadline: '2026-10-31',
  applicationWindowStatus: 'open',
});

const NSP_LIST = 'the National Scholarship Portal scheme list (scholarships.gov.in/All-Scholarships)';
const NSP_GUIDE = 'https://scholarships.gov.in/public/schemeGuidelines';

export const realSchemes: SeedScheme[] = [
  // ======================= EDUCATION — CENTRAL =======================
  {
    name: 'PM-USP Central Sector Scheme of Scholarship for College and University Students (CSSS)',
    slug: 'central-sector-scheme-of-scholarships',
    shortDescription: 'Merit-cum-means scholarship for Class 12 pass-outs above the 80th percentile pursuing regular degree courses.',
    description:
      'A component of the Pradhan Mantri Uchchatar Shiksha Protsahan (PM-USP) Yojana of the Department of Higher Education, Ministry of Education. It provides financial assistance to meritorious students from poor families to meet part of their day-to-day expenses while pursuing higher studies. Up to 82,000 fresh scholarships a year are awarded on the basis of Class 12 board results; 50% are earmarked for girls. Applications are made only on the National Scholarship Portal. For academic year 2026-27 the portal lists this scheme for renewal applications.',
    category: 'education',
    tags: ['scholarship', 'merit', 'college', 'NSP', 'higher education', 'PM-USP'],
    provider: 'Department of Higher Education, Ministry of Education',
    providerType: 'central_government',
    isAllIndia: true,
    educationLevels: ['undergraduate', 'postgraduate'],
    benefitType: 'scholarship',
    benefitSummary: '₹12,000 per year at graduation level and ₹20,000 per year at post-graduation level.',
    benefits: [
      '₹12,000 per annum for the first three years of college/university courses (graduation level).',
      '₹20,000 per annum at post-graduation level, and in the 4th/5th year of five-year/integrated professional courses.',
      'B.Tech/B.E. students receive ₹12,000 a year in years 1–3 and ₹20,000 in the 4th year.',
      'Paid by direct benefit transfer to a bank account in the student\'s name.',
    ],
    eligibilityRules: all(incomeAtMost(450000), isIn('educationLevel', ['undergraduate', 'postgraduate'])),
    additionalCriteria: [
      'For AY 2026-27 the National Scholarship Portal lists this scheme for RENEWAL applications only (window 01-06-2026 to 31-10-2026). Fresh applications are not listed for this year.',
      'You must be above the 80th percentile of successful candidates in your stream in the Class 12 examination of your board.',
      'You must be pursuing a regular degree course (not correspondence, distance or diploma) at an institution recognised by AICTE / the relevant regulatory body.',
      'You must not be availing any other merit scholarship, state scholarship, fee waiver or reimbursement scheme.',
      'Renewal each year needs at least 50% marks in the annual examination and at least 75% attendance.',
    ],
    requiredDocuments: [DOC.identity, DOC.marksheet, { ...DOC.income, description: 'Required for fresh applicants only.' }, DOC.admission, DOC.bank],
    applicationSteps: NSP_STEPS,
    officialSourceUrl: `${NSP_GUIDE}/CSSS_GUIDLINES_07022024_updated.pdf`,
    applicationUrl: 'https://scholarships.gov.in',
    ...NSP_2026_27('2026-06-01'),
    ...verified(`the PM-USP CSSS guidelines (applicable from 2022-23) linked from ${NSP_LIST}, which also lists the AY 2026-27 renewal window 01-06-2026 to 31-10-2026. Corrected: official name, exact rates, renewal conditions and the renewal-only status for 2026-27.`),
  },
  {
    name: 'National Means-cum-Merit Scholarship Scheme (NMMSS)',
    slug: 'national-means-cum-merit-scholarship',
    shortDescription: 'Scholarship of ₹12,000 a year for meritorious students from economically weaker families, Class 9 to Class 12.',
    description:
      'NMMSS, a central sector scheme of the Department of School Education & Literacy, awards 1,00,000 fresh scholarships a year to students selected through a state-level examination (MAT and SAT) held in Class 8, to arrest drop-out at Class 8 and encourage students to continue to the secondary stage. Students in Class 8 can appear for their state\'s NMMS examination; the scholarship is then paid from Class 9 to Class 12, subject to renewal conditions.',
    category: 'education',
    tags: ['school', 'merit', 'class 8', 'class 9', 'NSP'],
    provider: 'Department of School Education & Literacy, Ministry of Education',
    providerType: 'central_government',
    isAllIndia: true,
    educationLevels: ['class_9_10', 'class_11_12'],
    benefitType: 'scholarship',
    benefitSummary: '₹12,000 per year (₹1,000 per month) from Class 9 to Class 12.',
    benefits: ['₹12,000 per annum (₹1,000 per month) for a maximum of four years (Classes 9–12).', 'Paid by direct benefit transfer after verification on the National Scholarship Portal.'],
    eligibilityRules: all(
      incomeAtMost(350000),
      isIn('educationLevel', ['class_9_10', 'class_11_12']),
      isIn('institutionType', ['government', 'government_aided']),
    ),
    additionalCriteria: [
      'You must have been selected through the NMMS examination conducted by your state in Class 8 (MAT and SAT, at least 40% aggregate; 32% for SC/ST).',
      'You need at least 55% marks (or equivalent grade) in Class 7 to sit the exam, and at least 55% in Class 8 at selection (5% relaxation for SC/ST).',
      'Only students of Government, Government-aided and local body schools are eligible. Students of Kendriya Vidyalayas, Jawahar Navodaya Vidyalayas, residential schools run by the Centre/State with free boarding and lodging, and private schools are not eligible.',
      'To continue, you need clear promotion each year in the first attempt and at least 60% in Class 10 (5% relaxation for SC/ST).',
      'You can hold only one Central Government scholarship.',
    ],
    requiredDocuments: [DOC.identity, DOC.marksheet, DOC.income, { ...DOC.caste, optional: true, description: 'Only if claiming the SC/ST relaxation.' }, DOC.admission, DOC.bank],
    applicationSteps: [
      'Appear for the NMMS examination conducted by your state in Class 8.',
      'If selected, register and apply on the National Scholarship Portal in Class 9.',
      'Renew the scholarship on the portal every year up to Class 12.',
    ],
    officialSourceUrl: `${NSP_GUIDE}/NMMSSGuidelines.pdf`,
    applicationUrl: 'https://scholarships.gov.in',
    ...NSP_2026_27('2026-06-01'),
    ...verified(`the revised NMMSS guidelines (Ministry of Education letter of March 2022) linked from ${NSP_LIST}, which lists the AY 2026-27 window 01-06-2026 to 31-10-2026. Corrected: education levels (scholarship is paid in Classes 9–12), the excluded school types (Sainik Schools are not named in the guidelines), and renewal conditions.`),
  },
  {
    name: 'Post Matric Scholarship for Scheduled Caste Students (PMS-SC)',
    slug: 'post-matric-scholarship-sc',
    shortDescription: 'Fees plus an academic allowance for SC students studying beyond Class 10.',
    description:
      'A centrally sponsored scheme of the Department of Social Justice & Empowerment that provides financial assistance to Scheduled Caste students at the post-matriculation or post-secondary stage, so they can complete their education. Awards are made by the state/UT where the student is domiciled, through the state scholarship portal. States issue a Freeship Card so eligible students can take admission without paying fees upfront.',
    category: 'education',
    tags: ['SC', 'post-matric', 'scholarship', 'fee reimbursement', 'freeship'],
    provider: 'Department of Social Justice & Empowerment, Ministry of Social Justice & Empowerment',
    providerType: 'central_government',
    isAllIndia: true,
    educationLevels: POST_MATRIC,
    benefitType: 'scholarship',
    benefitSummary: 'Compulsory non-refundable fees plus an academic allowance of ₹2,500–₹13,500 a year, depending on course group.',
    benefits: [
      'Compulsory non-refundable fees, including tuition fee, as fixed by the state\'s fee fixation committee.',
      'Academic allowance per year — Group 1 (degree/PG professional): ₹13,500 hosteller / ₹7,000 day scholar; Group 2: ₹9,500 / ₹6,500; Group 3 (other graduate/PG): ₹6,000 / ₹3,000; Group 4 (post-Class 10 non-degree, e.g. Class 11–12): ₹4,000 / ₹2,500.',
      '10% extra allowance for students with disabilities. Correspondence/online students get fees but no academic allowance.',
    ],
    eligibilityRules: all(eq('socialCategory', 'sc'), incomeAtMost(250000), isIn('educationLevel', POST_MATRIC)),
    additionalCriteria: [
      'You must belong to a Scheduled Caste notified for the state/UT you are domiciled in, and have passed Class 10 (matriculation) or higher.',
      'Studying the same stage again in a different subject (e.g. B.Com after B.A.) is not eligible.',
      'You cannot hold another scholarship or stipend at the same time.',
      'Apply through your state\'s scholarship portal, as notified by your state.',
    ],
    requiredDocuments: [DOC.identity, DOC.caste, DOC.income, DOC.domicile, DOC.marksheet, DOC.admission, DOC.fee, DOC.bank],
    applicationSteps: [
      'Register on your state\'s scholarship portal for a Freeship Card before admission (registration stays open through the year).',
      'Apply for the scholarship on the portal on the day you take admission; the institution verifies your admission online.',
      'Renewals are processed on promotion to the next class with the required attendance.',
      'Payment is made by direct benefit transfer.',
    ],
    officialSourceUrl: 'https://socialjustice.gov.in/schemes/25',
    applicationUrl: null,
    ...verified('the PMS-SC Scheme Guidelines (revised March 2021) published on the Department of Social Justice & Empowerment scheme page (socialjustice.gov.in/schemes/25). Corrected: added the official academic allowance rates and the state-portal / Freeship Card application route. Application dates are set by each state and are not asserted here.'),
  },
  {
    name: 'Pre-Matric Scholarship for Scheduled Caste Students (Classes 9 and 10)',
    slug: 'pre-matric-scholarship-sc',
    shortDescription: '₹3,500 a year (day scholars) or ₹7,000 (hostellers) for SC students in Classes 9 and 10.',
    description:
      'Component 1 of the centrally sponsored Pre-Matric Scholarship Scheme for Scheduled Castes & Others, implemented through state governments and UT administrations. It supports SC students studying in Classes 9 and 10 so that participation improves, drop-out is minimised, and students progress to the post-matric stage.',
    category: 'education',
    tags: ['SC', 'pre-matric', 'school', 'class 9', 'class 10'],
    provider: 'Department of Social Justice & Empowerment, Ministry of Social Justice & Empowerment',
    providerType: 'central_government',
    isAllIndia: true,
    educationLevels: ['class_9_10'],
    benefitType: 'scholarship',
    benefitSummary: 'Consolidated academic allowance of ₹3,500 per year for day scholars and ₹7,000 per year for hostellers.',
    benefits: ['₹3,500 per annum for day scholars.', '₹7,000 per annum for hostellers.'],
    eligibilityRules: all(eq('socialCategory', 'sc'), incomeAtMost(250000), eq('educationLevel', 'class_9_10')),
    additionalCriteria: ['You must be studying in Class 9 or 10 on a full-time basis.', 'The scholarship is awarded by the state/UT where you are domiciled.'],
    requiredDocuments: [DOC.identity, DOC.caste, DOC.income, DOC.marksheet, DOC.admission, DOC.bank],
    applicationSteps: [
      'Complete the initial registration on the National Scholarship Portal (invited in April each year).',
      'Your registration is shared with your state; complete the application on the state portal.',
      'Your school verifies the application; payment is made through direct benefit transfer.',
    ],
    officialSourceUrl: 'https://socialjustice.gov.in/schemes/23',
    applicationUrl: 'https://scholarships.gov.in',
    ...verified('the Department of Social Justice & Empowerment scheme page (socialjustice.gov.in/schemes/23): eligibility, ₹2.5 lakh income ceiling and the rates in force from 2022-23. Corrected: added the official rates and the NSP-then-state-portal application route.'),
  },
  {
    name: 'Post Matric Scholarship for Scheduled Tribe Students',
    slug: 'post-matric-scholarship-st',
    shortDescription: 'Fees plus a monthly stipend of ₹230–₹1,200 for ST students studying beyond Class 10.',
    description:
      'A centrally sponsored scheme of the Ministry of Tribal Affairs for Scheduled Tribe students studying recognised post-matriculation or post-secondary courses. States/UTs invite applications on their own portal or the National Scholarship Portal, verify eligibility and pay students directly.',
    category: 'education',
    tags: ['ST', 'tribal', 'post-matric', 'scholarship'],
    provider: 'Ministry of Tribal Affairs',
    providerType: 'central_government',
    isAllIndia: true,
    educationLevels: POST_MATRIC,
    benefitType: 'scholarship',
    benefitSummary: 'Compulsory fees (as fixed by the state) plus a stipend of ₹230–₹1,200 per month, depending on course group.',
    benefits: [
      'Compulsory fees as fixed by the state fee fixation committee (for private institutions the central share is capped, e.g. ₹2.5 lakh a year for engineering, ₹6 lakh for MBBS/MS/MD, ₹1 lakh for other courses).',
      'Monthly stipend — Group I (professional degree/PG): ₹1,200 hosteller / ₹550 day scholar; Group II (BA/B.Sc/B.Com/MA etc.): ₹820 / ₹530; Group III (ITI, polytechnic diploma): ₹570 / ₹300; Group IV (e.g. Class 11–12): ₹380 / ₹230.',
    ],
    eligibilityRules: all(eq('socialCategory', 'st'), incomeAtMost(250000), isIn('educationLevel', POST_MATRIC)),
    additionalCriteria: [
      'You must belong to a Scheduled Tribe notified for your domicile state, and have passed Class 10 or higher.',
      'You need a bank account linked with Aadhaar and your mobile number.',
      'You must not be getting any other scholarship.',
      'Students admitted to the Ministry\'s notified Top Class institutes are covered by a separate scheme instead of this one.',
    ],
    requiredDocuments: [DOC.identity, DOC.caste, DOC.income, DOC.domicile, DOC.marksheet, DOC.admission, DOC.fee, DOC.bank, DOC.photo],
    applicationSteps: [
      'Check whether your state uses its own portal or the National Scholarship Portal.',
      'Register, fill the application and upload the requested documents.',
      'Your institution verifies the application; payment is made through direct benefit transfer.',
    ],
    officialSourceUrl: 'https://tribal.nic.in/downloads/guidelines/post-matric/Post-matric-guidelines-15032023.pdf',
    applicationUrl: 'https://scholarships.gov.in',
    ...verified('the Ministry of Tribal Affairs Post Matric Scholarship guidelines (March 2023) and scheme page (tribal.nic.in/Scholarship.aspx). Corrected: added official stipend rates, the private-institution fee caps and the Top Class institute exclusion. Application dates are set by each state.'),
  },
  {
    name: 'Pre-Matric Scholarship for Scheduled Tribe Students (Classes 9 and 10)',
    slug: 'pre-matric-scholarship-st',
    shortDescription: '₹225 a month (day scholars) or ₹525 a month (hostellers) for ST students in Classes 9 and 10.',
    description:
      'A centrally sponsored scheme of the Ministry of Tribal Affairs that supports Scheduled Tribe children studying in Classes 9 and 10, so that drop-out in the transition from elementary to secondary stage is minimised. Awarded by the state/UT of domicile.',
    category: 'education',
    tags: ['ST', 'tribal', 'pre-matric', 'school'],
    provider: 'Ministry of Tribal Affairs',
    providerType: 'central_government',
    isAllIndia: true,
    educationLevels: ['class_9_10'],
    benefitType: 'scholarship',
    benefitSummary: '₹225 per month for day scholars and ₹525 per month for hostellers, for 10 months a year.',
    benefits: ['Day scholars: ₹225 per month (₹2,250 a year).', 'Hostellers: ₹525 per month (₹5,250 a year).'],
    eligibilityRules: all(eq('socialCategory', 'st'), incomeAtMost(250000), eq('educationLevel', 'class_9_10')),
    additionalCriteria: [
      'You must be studying in a Government school or a school recognised by the Government or a Central/State Board.',
      'You need a bank account linked with Aadhaar and your mobile number, and must not be getting any other scholarship.',
      'For orphans supported by a guardian, the income criterion does not apply.',
    ],
    requiredDocuments: [DOC.identity, DOC.caste, DOC.income, DOC.domicile, DOC.photo, DOC.bank],
    applicationSteps: [
      'Check your state\'s scholarship portal or the National Scholarship Portal for the application window.',
      'Fill the form and upload the requested documents.',
      'Your school verifies the application; payment is made through direct benefit transfer.',
    ],
    officialSourceUrl: 'https://tribal.nic.in/downloads/guidelines/pre-matric/guidelines-Pre-matric-17-Oct-2022.pdf',
    applicationUrl: 'https://scholarships.gov.in',
    ...verified('the Ministry of Tribal Affairs Pre-Matric Scholarship guidelines (2021-22 to 2025-26, issued October 2022) and its scheme page. Corrected: added the official rates. Note: the guideline period is stated as 2021-22 to 2025-26; check the Ministry page for any revision for 2026-27.'),
  },
  {
    name: 'PM YASASVI — Post-Matric Scholarship for OBC, EBC and DNT Students',
    slug: 'pm-yasasvi-post-matric-obc-ebc-dnt',
    shortDescription: 'Post-matric scholarship for students from OBC, Economically Backward Class (EBC) and De-notified Tribe (DNT) communities.',
    description:
      'The centrally sponsored post-matric component of the PM Young Achievers Scholarship Award Scheme for Vibrant India (PM YASASVI) of the Ministry of Social Justice & Empowerment. It supports OBC, EBC and DNT students studying at post-matriculation or post-secondary level and is awarded by the state/UT where the student is permanently settled.',
    category: 'education',
    tags: ['OBC', 'EBC', 'DNT', 'post-matric', 'YASASVI'],
    provider: 'Department of Social Justice & Empowerment, Ministry of Social Justice & Empowerment',
    providerType: 'central_government',
    isAllIndia: true,
    educationLevels: POST_MATRIC,
    benefitType: 'scholarship',
    benefitSummary: 'Tuition fee and academic allowance for post-matric studies (rates depend on course group).',
    benefits: ['Tuition fee support, subject to the limits in the scheme guidelines.', 'Academic allowance varying by course group; states may top it up.', 'A Freeship Card lets eligible students take admission without paying fees upfront.'],
    eligibilityRules: all(
      isIn('socialCategory', ['obc', 'general', 'ews']),
      incomeAtMost(250000),
      isIn('educationLevel', POST_MATRIC),
    ),
    additionalCriteria: [
      'You must belong to an OBC, Economically Backward Class (EBC) or De-notified / Nomadic / Semi-Nomadic Tribe (DNT) community as notified by the Central/State Government. General-category applicants qualify only under the EBC definition.',
      'Only two boys of the same parents can receive the scholarship (no such limit for girls).',
      'Studying the same stage again in a different subject is not eligible, and you cannot hold another scholarship at the same time.',
    ],
    requiredDocuments: [DOC.identity, DOC.caste, DOC.income, DOC.marksheet, DOC.admission, DOC.photo, DOC.bank],
    applicationSteps: [
      'Register on your state\'s scholarship portal for a Freeship Card before admission.',
      'Fill the application and upload the requested documents.',
      'Your institution verifies the application; payment is made through direct benefit transfer.',
    ],
    officialSourceUrl: 'https://socialjustice.gov.in/schemes/101',
    applicationUrl: null,
    ...verified('the PM YASASVI scheme guidelines (2021-22 to 2025-26) published on socialjustice.gov.in/schemes/101 (Part B: Post-Matric Scholarship). Corrected: added the two-boys limit and the Freeship Card route. Note: the guideline period is 2021-22 to 2025-26; the Ministry\'s scheme page still lists the scheme. Application dates are set by each state.'),
  },
  {
    name: 'Central Sector Scholarship of Top Class Education for SC Students',
    slug: 'top-class-education-sc',
    shortDescription: 'Full tuition plus ₹86,000 (first year) / ₹41,000 (later years) for SC students at notified top institutions.',
    description:
      'A Department of Social Justice & Empowerment scheme that promotes quality education among SC students by fully funding studies beyond Class 12 at notified institutions (IITs, IIMs, AIIMS, NITs, NIFTs, NIDs, IHMs, NLUs and other notified institutions). Each institution has a fixed number of slots, 30% of which are reserved for girls.',
    category: 'education',
    tags: ['SC', 'top class', 'IIT', 'IIM', 'premier institutes'],
    provider: 'Department of Social Justice & Empowerment, Ministry of Social Justice & Empowerment',
    providerType: 'central_government',
    isAllIndia: true,
    educationLevels: ['undergraduate', 'postgraduate', 'doctoral', 'diploma'],
    benefitType: 'scholarship',
    benefitSummary: 'Full tuition and non-refundable fees (capped at ₹2 lakh a year at private institutions) plus an academic allowance of ₹86,000 in the first year and ₹41,000 in later years.',
    benefits: [
      'Full tuition fee and non-refundable charges, with a ceiling of ₹2.00 lakh per year at private sector institutions.',
      'Academic allowance of ₹86,000 in the first year and ₹41,000 in each later year, for living expenses, books, stationery and a computer/laptop with accessories.',
      'Paid directly to the student by direct benefit transfer.',
    ],
    eligibilityRules: all(eq('socialCategory', 'sc'), incomeAtMost(800000), isIn('educationLevel', ['undergraduate', 'postgraduate', 'doctoral', 'diploma'])),
    additionalCriteria: [
      'You must be admitted to a full-time course at one of the institutions notified under this scheme.',
      'Fresh scholarships are awarded only to first-year students; if more students apply than an institution\'s slots, selection is by merit.',
      'No more than two siblings in a family can benefit.',
    ],
    requiredDocuments: [DOC.identity, DOC.caste, DOC.income, DOC.admission, DOC.fee, DOC.bank],
    applicationSteps: NSP_STEPS,
    officialSourceUrl: `${NSP_GUIDE}/Top_Class_Education_Scheme_2018.pdf`,
    applicationUrl: 'https://scholarships.gov.in',
    ...NSP_2026_27('2026-06-01'),
    ...verified(`the Scheme Guidelines of the Scheme of Top Class Scholarship for SC Students (applicable from 2025-26) linked from ${NSP_LIST}, which lists the AY 2026-27 window 01-06-2026 to 31-10-2026. Corrected: official name, exact benefit amounts, first-year-only fresh awards and the two-sibling limit.`),
  },
  {
    name: 'Post Matric Scholarship Scheme for Minorities',
    slug: 'post-matric-scholarship-minorities',
    shortDescription: 'Scholarship for students from notified minority communities studying from Class 11 to PhD.',
    description:
      'A Ministry of Minority Affairs scholarship for meritorious students from economically weaker sections of the six notified minority communities — Muslims, Christians, Sikhs, Buddhists, Jains and Parsis — studying in Class 11 up to PhD, including technical and vocational courses at ITIs.',
    category: 'education',
    tags: ['minority', 'post-matric', 'NSP', 'scholarship'],
    provider: 'Ministry of Minority Affairs',
    providerType: 'central_government',
    isAllIndia: true,
    educationLevels: POST_MATRIC,
    benefitType: 'scholarship',
    benefitSummary: 'Admission/tuition fee support and maintenance allowance (rates depend on course).',
    benefits: ['Admission and tuition fee, subject to ceilings.', 'Maintenance allowance for hostellers and day scholars.'],
    eligibilityRules: all(
      isIn('minorityCommunity', ['muslim', 'christian', 'sikh', 'buddhist', 'jain', 'parsi']),
      incomeAtMost(200000),
      marksAtLeast(50),
      isIn('educationLevel', POST_MATRIC),
    ),
    additionalCriteria: [
      'Scholarships are limited in number; students from BPL families with the lowest income get preference.',
      'This scheme is not in the National Scholarship Portal\'s AY 2026-27 central scheme list — check the Ministry of Minority Affairs and NSP for whether applications are being accepted this year.',
    ],
    requiredDocuments: [DOC.identity, DOC.income, { docId: 'community-declaration', name: 'Self-declaration of minority community' }, DOC.marksheet, DOC.admission, DOC.fee, DOC.bank],
    applicationSteps: NSP_STEPS,
    officialSourceUrl: 'https://www.minorityaffairs.gov.in/show_content.php?lang=1&level=2&ls_id=163&lid=165',
    applicationUrl: 'https://scholarships.gov.in',
    ...needsReview('the Ministry of Minority Affairs scheme document (minorityaffairs.gov.in/WriteReadData/RTF1984/1672032313.pdf) matches the income limit (₹2 lakh) and 50% marks rule, but it is undated, the Ministry page was last updated in August 2022, and the scheme is not in the NSP AY 2026-27 scheme list, so its current status could not be confirmed.'),
  },
  {
    name: 'Ishan Uday — Special Scholarship Scheme for North Eastern Region',
    slug: 'ishan-uday-north-eastern-region',
    shortDescription: 'UGC scholarship of ₹8,000 a month for first-year undergraduates from the North Eastern Region.',
    description:
      'Ishan Uday, administered by the University Grants Commission, offers 10,000 scholarships a year to students from economically weaker sections of the North Eastern Region who are admitted to the first year of a first undergraduate degree. Half the slots are for Arts, Humanities, Social Sciences, Law and Management, and half for Science, Engineering, Medical, Technical, Agriculture and Forestry programmes. Selection is by state-wise merit.',
    category: 'education',
    tags: ['UGC', 'north east', 'undergraduate', 'scholarship'],
    provider: 'University Grants Commission (UGC)',
    providerType: 'statutory_body',
    isAllIndia: false,
    applicableStates: NE_STATES,
    educationLevels: ['undergraduate'],
    benefitType: 'scholarship',
    benefitSummary: '₹8,000 per month for 10 months a year, for the duration of the UG programme.',
    benefits: ['₹8,000 per month for 10 months in a year.', 'Renewed each year on promotion, good conduct and attendance; paid by direct benefit transfer.'],
    // The guidelines say parental income must be BELOW ₹4.5 lakh (₹4.5 lakh or more is not eligible).
    eligibilityRules: all(incomeBelow(450000), eq('educationLevel', 'undergraduate')),
    additionalCriteria: [
      'You must have passed Class 12 from a school located in the North Eastern Region and hold a valid domicile certificate of an NER state.',
      'You must be in the first year of your first UG degree, in regular/full-time mode (not open, distance or part-time), and not admitted through management quota.',
      'Your institution must be one of the types eligible under the scheme (e.g. UGC 2(f) institutions with valid NAAC accreditation, Institutions of National Importance).',
      'You can receive only one scholarship at a time.',
    ],
    requiredDocuments: [DOC.identity, DOC.domicile, DOC.marksheet, DOC.income, DOC.admission, DOC.bank],
    applicationSteps: NSP_STEPS,
    officialSourceUrl: `${NSP_GUIDE}/Guidelines_ISHAN%20UDAY_2324.pdf`,
    applicationUrl: 'https://scholarships.gov.in',
    ...NSP_2026_27('2026-09-16'),
    ...verified(`the UGC Ishan Uday guidelines linked from ${NSP_LIST}, which lists the AY 2026-27 window 16-09-2026 to 31-10-2026. Corrected: the benefit is a flat ₹8,000/month for 10 months (not different rates by course), and the income limit is strictly below ₹4.5 lakh.`),
  },
  // ======================= WOMEN / DISABILITY (AICTE, DEPwD) =======================
  {
    name: 'AICTE Pragati Scholarship Scheme for Girl Students (Technical Education)',
    slug: 'aicte-pragati-scholarship-girls',
    shortDescription: '₹50,000 a year for girls in the first year (or lateral-entry second year) of an AICTE-approved degree or diploma.',
    description:
      'Pragati is an AICTE scheme for "Empowering Women through Technical Education". It supports girl students admitted to the first year (or second year through lateral entry) of a degree or diploma programme at an AICTE-approved institution. There are 5,000 degree and 5,000 diploma scholarships a year distributed by state, and all eligible girls from the North Eastern states and specified UTs are covered.',
    category: 'women_empowerment',
    tags: ['AICTE', 'girls', 'engineering', 'diploma', 'technical'],
    provider: 'All India Council for Technical Education (AICTE)',
    providerType: 'statutory_body',
    isAllIndia: true,
    educationLevels: ['diploma', 'undergraduate'],
    benefitType: 'scholarship',
    benefitSummary: '₹50,000 per year for each year of study (up to 4 years for a degree, 3 for a diploma).',
    benefits: ['₹50,000 per annum as a lump sum towards college fee, computer, books, equipment and software.', 'Degree: up to 4 years (3 for lateral entry). Diploma: up to 3 years (2 for lateral entry).'],
    eligibilityRules: all(
      eq('gender', 'female'),
      eq('courseStream', 'engineering_technical'),
      isIn('educationLevel', ['diploma', 'undergraduate']),
      { field: 'academicYear', operator: 'lessThanOrEqual', value: 2 },
      incomeAtMost(800000),
    ),
    additionalCriteria: [
      'You must be admitted to the first year (or second year through lateral entry) of a degree/diploma course at an AICTE-approved institution.',
      'A maximum of two girls per family are eligible.',
      'The gap between passing the qualifying exam and admission must not be more than two years.',
      'You must not receive any other scholarship, stipend or salary during the course.',
    ],
    requiredDocuments: [DOC.identity, DOC.marksheet, { ...DOC.income, description: 'Valid income certificate issued by the State/UT Government.' }, DOC.admission, DOC.bank, DOC.photo],
    applicationSteps: NSP_STEPS,
    officialSourceUrl: `${NSP_GUIDE}/AICTE/AICTE_2010_G.pdf`,
    applicationUrl: 'https://scholarships.gov.in',
    ...NSP_2026_27('2026-06-01'),
    ...verified(`the AICTE Pragati (Degree and Diploma) guidelines linked from ${NSP_LIST}, which lists the AY 2026-27 window 01-06-2026 to 31-10-2026. Corrected: confirmed the ₹50,000 amount and two-girls rule; added the two-year gap rule. Note: the linked guidelines are dated July 2020.`),
  },
  {
    name: 'AICTE Saksham Scholarship Scheme for Specially-Abled Students',
    slug: 'aicte-saksham-scholarship',
    shortDescription: '₹50,000 a year for students with 40%+ disability in the first year (or lateral-entry second year) of AICTE-approved courses.',
    description:
      'Saksham is a scheme implemented by AICTE to encourage specially-abled students to pursue technical education. Every eligible student with a disability of 40% or more admitted to the first year (or second year through lateral entry) of an AICTE-approved degree or diploma course gets the scholarship.',
    category: 'disability_support',
    tags: ['AICTE', 'disability', 'PwD', 'technical', 'engineering'],
    provider: 'All India Council for Technical Education (AICTE)',
    providerType: 'statutory_body',
    isAllIndia: true,
    educationLevels: ['diploma', 'undergraduate'],
    benefitType: 'scholarship',
    benefitSummary: '₹50,000 per year for each year of study (up to 4 years for a degree, 3 for a diploma).',
    benefits: ['₹50,000 per annum as a lump sum towards college fee, computer, books, equipment and software.', 'Degree: up to 4 years (3 for lateral entry). Diploma: up to 3 years (2 for lateral entry).'],
    eligibilityRules: all(
      eq('disabilityStatus', 'benchmark'),
      eq('courseStream', 'engineering_technical'),
      isIn('educationLevel', ['diploma', 'undergraduate']),
      { field: 'academicYear', operator: 'lessThanOrEqual', value: 2 },
      incomeAtMost(800000),
    ),
    additionalCriteria: [
      'You must be admitted to the first year (or second year through lateral entry) at an AICTE-approved institution.',
      'The gap between passing the qualifying exam and admission must not be more than two years.',
      'You must not receive any other scholarship, stipend or salary during the course.',
    ],
    requiredDocuments: [DOC.identity, DOC.disability, DOC.marksheet, { ...DOC.income, description: 'Valid income certificate issued by the State/UT Government.' }, DOC.admission, DOC.bank],
    applicationSteps: NSP_STEPS,
    officialSourceUrl: `${NSP_GUIDE}/AICTE/AICTE_2012_G.pdf`,
    applicationUrl: 'https://scholarships.gov.in',
    ...NSP_2026_27('2026-06-01'),
    ...verified(`the AICTE Saksham (Degree and Diploma) guidelines linked from ${NSP_LIST}, which lists the AY 2026-27 window 01-06-2026 to 31-10-2026. Corrected: added the first-year / lateral-entry condition to the automated rules and the two-year gap rule. Note: the linked guidelines are dated July 2020.`),
  },
  {
    name: 'Post-Matric Scholarship for Students with Disabilities',
    slug: 'post-matric-scholarship-students-with-disabilities',
    shortDescription: 'Scholarship for students with benchmark disabilities from Class 11 up to Master\'s level.',
    description:
      'A component of the DEPwD central sector umbrella scheme "Scholarships for Students with Disabilities". It supports students with 40% or more disability studying recognised post-matric courses up to Master\'s degree level, including diploma and correspondence courses. There are 17,000 slots (including renewals), 50% reserved for female candidates.',
    category: 'disability_support',
    tags: ['disability', 'PwD', 'DEPwD', 'post-matric'],
    provider: 'Department of Empowerment of Persons with Disabilities (DEPwD)',
    providerType: 'central_government',
    isAllIndia: true,
    educationLevels: ['class_11_12', 'iti', 'diploma', 'undergraduate', 'postgraduate'],
    benefitType: 'scholarship',
    benefitSummary: 'Fees up to ₹1.40 lakh a year, plus maintenance (₹650–₹1,200/month), disability and book allowances.',
    benefits: [
      'Admission and tuition fee up to ₹1.40 lakh per year, and miscellaneous compulsory fees up to ₹10,000 per year (actuals).',
      'Maintenance allowance: ₹1,200 per month for hostellers, ₹650 per month for day scholars.',
      'Disability allowance: ₹4,000 per year for visual or intellectual disabilities, ₹2,000 per year for other disabilities.',
      'Book allowance: ₹1,500 per year.',
    ],
    eligibilityRules: all(eq('disabilityStatus', 'benchmark'), incomeAtMost(250000), isIn('educationLevel', ['class_11_12', 'iti', 'diploma', 'undergraduate', 'postgraduate'])),
    additionalCriteria: [
      'You need a valid disability certificate and UDID (or UDID enrolment).',
      'Not more than two children with disabilities of the same parents can benefit.',
      'Studying the same stage again in a different subject is not eligible; the scholarship for a class is given only once.',
      'Slots are limited — renewals are processed first, so meeting the criteria does not guarantee an award.',
    ],
    requiredDocuments: [DOC.identity, DOC.disability, DOC.income, DOC.marksheet, DOC.admission, DOC.fee, DOC.photo, DOC.bank],
    applicationSteps: NSP_STEPS,
    officialSourceUrl: `${NSP_GUIDE}/DEPDGuidelines_1.pdf`,
    applicationUrl: 'https://scholarships.gov.in',
    ...NSP_2026_27('2026-07-25'),
    ...verified(`the DEPwD "Scholarships for Students with Disabilities" guidelines (revised 25 September 2024) linked from ${NSP_LIST}, which lists the AY 2026-27 window 25-07-2026 to 31-10-2026. Corrected: the scheme covers courses up to Master's level (PhD removed), and the official rates were added.`),
  },
  {
    name: 'Pre-Matric Scholarship for Students with Disabilities',
    slug: 'pre-matric-scholarship-students-with-disabilities',
    shortDescription: 'Scholarship for students with benchmark disabilities in Classes 9 and 10.',
    description:
      'A component of the DEPwD central sector umbrella scheme "Scholarships for Students with Disabilities" for students with 40% or more disability studying full-time in Classes 9 and 10 in a Government school or a recognised school. There are 25,000 slots (including renewals), 50% reserved for female candidates.',
    category: 'disability_support',
    tags: ['disability', 'PwD', 'DEPwD', 'pre-matric', 'school'],
    provider: 'Department of Empowerment of Persons with Disabilities (DEPwD)',
    providerType: 'central_government',
    isAllIndia: true,
    educationLevels: ['class_9_10'],
    benefitType: 'scholarship',
    benefitSummary: 'Maintenance of ₹500–₹800 per month plus disability and book allowances.',
    benefits: [
      'Maintenance allowance: ₹800 per month for hostellers, ₹500 per month for day scholars.',
      'Disability allowance: ₹4,000 per year for visual or intellectual disabilities, ₹2,000 per year for other disabilities.',
      'Book allowance: ₹1,000 per year.',
    ],
    eligibilityRules: all(eq('disabilityStatus', 'benchmark'), incomeAtMost(250000), eq('educationLevel', 'class_9_10')),
    additionalCriteria: [
      'You must be a regular, full-time student in Class 9 or 10 in a Government school or a recognised school.',
      'You need a valid disability certificate and UDID (or UDID enrolment).',
      'Not more than two children with disabilities of the same parents can benefit.',
      'Slots are limited — renewals are processed first.',
    ],
    requiredDocuments: [DOC.identity, DOC.disability, DOC.income, DOC.marksheet, DOC.admission, DOC.photo, DOC.bank],
    applicationSteps: NSP_STEPS,
    officialSourceUrl: `${NSP_GUIDE}/DEPDGuidelines_1.pdf`,
    applicationUrl: 'https://scholarships.gov.in',
    ...NSP_2026_27('2026-07-25'),
    ...verified(`the DEPwD "Scholarships for Students with Disabilities" guidelines (revised 25 September 2024) linked from ${NSP_LIST}, which lists the AY 2026-27 window 25-07-2026 to 31-10-2026. Corrected: added the official rates and conditions.`),
  },
  {
    name: 'Scholarship for Top Class Education for Students with Disabilities',
    slug: 'top-class-education-students-with-disabilities',
    shortDescription: 'Fees up to ₹1.90 lakh a year plus allowances for students with benchmark disabilities at notified institutions.',
    description:
      'A component of the DEPwD central sector umbrella scheme "Scholarships for Students with Disabilities" for students with 40% or more disability pursuing graduate or post-graduate degree/diploma courses at institutes of excellence notified by the Department. There are 300 slots (including renewals).',
    category: 'disability_support',
    tags: ['disability', 'PwD', 'DEPwD', 'top class'],
    provider: 'Department of Empowerment of Persons with Disabilities (DEPwD)',
    providerType: 'central_government',
    isAllIndia: true,
    educationLevels: ['diploma', 'undergraduate', 'postgraduate'],
    benefitType: 'scholarship',
    benefitSummary: 'Fees up to ₹1.90 lakh a year, maintenance of ₹1,500–₹3,000/month, and one-time grants for a computer and assistive devices.',
    benefits: [
      'Admission and tuition fee up to ₹1.90 lakh per year, and miscellaneous compulsory fees up to ₹10,000 per year (actuals).',
      'One-time grants in the first year: ₹45,000 for a computer/laptop and ₹30,000 for aids and assistive devices (against bills).',
      'Maintenance allowance: ₹3,000 per month for hostellers, ₹1,500 per month for day scholars.',
      'Special allowance (reader, escort, helper etc.): ₹2,000 per month. Book allowance: ₹5,000 per year.',
    ],
    eligibilityRules: all(eq('disabilityStatus', 'benchmark'), incomeAtMost(800000), isIn('educationLevel', ['diploma', 'undergraduate', 'postgraduate'])),
    additionalCriteria: [
      'You must be studying at one of the institutions of excellence notified by DEPwD.',
      'Distance-learning, part-time and weekend courses are not eligible, and the award is given only once.',
      'You need a valid disability certificate and UDID (or UDID enrolment).',
    ],
    requiredDocuments: [DOC.identity, DOC.disability, DOC.income, DOC.marksheet, DOC.admission, DOC.fee, DOC.photo, DOC.bank],
    applicationSteps: NSP_STEPS,
    officialSourceUrl: `${NSP_GUIDE}/DEPDGuidelines_1.pdf`,
    applicationUrl: 'https://scholarships.gov.in',
    ...NSP_2026_27('2026-06-01'),
    ...verified(`the DEPwD "Scholarships for Students with Disabilities" guidelines (revised 25 September 2024) linked from ${NSP_LIST}, which lists the AY 2026-27 window 01-06-2026 to 31-10-2026. Corrected: added the official rates and conditions.`),
  },
  // ======================= EMPLOYMENT & SKILLS =======================
  {
    name: 'PM Internship Scheme',
    slug: 'pm-internship-scheme',
    shortDescription: 'Paid 12-month internships in leading companies for young people not in full-time education or employment.',
    description:
      'The PM Internship Scheme of the Ministry of Corporate Affairs offers young people real-life work experience through 12-month internships with top companies. Interns receive monthly financial assistance and a one-time grant. The scheme began as a pilot; check the portal for the current phase and rules.',
    category: 'employment_skills',
    tags: ['internship', 'youth', 'jobs', 'stipend'],
    provider: 'Ministry of Corporate Affairs',
    providerType: 'central_government',
    isAllIndia: true,
    educationLevels: [],
    benefitType: 'stipend',
    benefitSummary: 'Monthly financial assistance during a 12-month internship plus a one-time grant.',
    benefits: [
      'Announced for the pilot phase: ₹5,000 per month for 12 months and a one-time grant of ₹6,000 — confirm current amounts on the portal.',
      'Insurance cover as per the scheme guidelines.',
    ],
    eligibilityRules: all(ageAtLeast(21), ageAtMost(24), incomeAtMost(800000), { field: 'employmentStatus', operator: 'notEquals', value: 'employed' }),
    additionalCriteria: [
      'You must not be in full-time education or full-time employment (online / distance learners may be allowed).',
      'Graduates of certain premier institutes and holders of certain professional or master\'s qualifications are excluded.',
      'No family member should be a permanent government employee or earn above the income limit, as per scheme rules.',
    ],
    requiredDocuments: [DOC.identity, DOC.marksheet, DOC.photo, DOC.bank],
    applicationSteps: [
      'Register on the PM Internship portal and complete your profile.',
      'Browse internship opportunities and apply to the ones that suit you (within the allowed number).',
      'If shortlisted and selected by a company, accept the offer on the portal.',
    ],
    officialSourceUrl: 'https://pminternship.mca.gov.in',
    applicationUrl: 'https://pminternship.mca.gov.in',
    ...needsReview('the official portal pminternship.mca.gov.in is a JavaScript application whose eligibility text could not be read. Press Information Bureau releases on the 2024-25 pilot (pib.gov.in, PRID 2061909 and 2110332) state age 21–24, a ₹8 lakh family income limit, ₹5,000/month and a ₹6,000 one-time grant, but they describe the pilot phase, not necessarily the current rules.'),
  },
  {
    name: 'Deen Dayal Upadhyaya Grameen Kaushalya Yojana (DDU-GKY)',
    slug: 'ddu-gky',
    shortDescription: 'Free placement-linked skill training for rural youth from poor families.',
    description:
      'DDU-GKY, under the Ministry of Rural Development, provides placement-linked skill development to rural youth from poor families, with training delivered through partner agencies and a focus on placement in regular jobs.',
    category: 'employment_skills',
    tags: ['skills', 'rural', 'training', 'placement', 'youth'],
    provider: 'Ministry of Rural Development',
    providerType: 'central_government',
    isAllIndia: true,
    educationLevels: [],
    benefitType: 'training',
    benefitSummary: 'Free skill training with placement support; post-placement support as per scheme norms.',
    benefits: ['Free residential or non-residential training in market-relevant trades.', 'Placement support after training.'],
    // Age 15–35, with a higher upper limit (45) for women, SC/ST candidates and persons with disabilities.
    eligibilityRules: all(
      eq('residenceType', 'rural'),
      ageAtLeast(15),
      any(
        ageAtMost(35),
        all(
          ageAtMost(45),
          any(eq('gender', 'female'), isIn('socialCategory', ['sc', 'st']), eq('disabilityStatus', 'benchmark')),
        ),
      ),
    ),
    additionalCriteria: ['You should belong to a poor rural household as identified under the scheme (for example, through SECC or other notified lists).'],
    requiredDocuments: [DOC.identity, DOC.domicile, DOC.photo, DOC.bank],
    applicationSteps: [
      'Contact your nearest DDU-GKY training centre or the district rural development agency.',
      'Get your eligibility checked and enrol in a suitable trade.',
      'Complete the training and participate in placement activities.',
    ],
    officialSourceUrl: 'https://ddugky.gov.in',
    applicationUrl: null,
    ...needsReview('ddugky.gov.in, ddugky.rural.gov.in and rural.gov.in did not return usable content from the audit environment (timeouts / empty page). Age limits and benefits are from earlier public documentation and have not been checked against an official source.'),
  },
  {
    name: 'PM Vishwakarma',
    slug: 'pm-vishwakarma',
    shortDescription: 'Recognition, skilling, a ₹15,000 toolkit grant and collateral-free loans at 5% for traditional artisans.',
    description:
      'PM Vishwakarma (Ministry of MSME) supports artisans and craftspeople working with their hands and tools in one of 18 family-based traditional trades, in the unorganised sector on a self-employment basis. It offers recognition through a certificate and ID card, skill upgradation, a toolkit incentive, collateral-free credit at a concessional rate, and marketing support.',
    category: 'employment_skills',
    tags: ['artisan', 'craft', 'credit', 'training', 'Vishwakarma'],
    provider: 'Ministry of Micro, Small and Medium Enterprises',
    providerType: 'central_government',
    isAllIndia: true,
    benefitType: 'loan',
    benefitSummary: 'Training with a ₹500/day stipend, a ₹15,000 toolkit grant and collateral-free loans of ₹1 lakh and ₹2 lakh at 5% interest.',
    benefits: [
      'PM Vishwakarma certificate and ID card.',
      'Skill verification followed by 5–7 days (40 hours) of basic training; optional 15 days (120 hours) of advanced training. Training stipend: ₹500 per day.',
      'Toolkit incentive: ₹15,000 grant.',
      'Collateral-free enterprise development loans: ₹1 lakh (first tranche, 18-month repayment) and ₹2 lakh (second tranche, 30-month repayment) at 5% interest, with interest subvention paid by the Ministry.',
      'Marketing support such as quality certification, branding, e-commerce linkage and trade fairs.',
    ],
    eligibilityRules: all(ageAtLeast(18), eq('occupation', 'artisan_craftsperson')),
    additionalCriteria: [
      'You must be engaged in one of the 18 notified trades on the date of registration: carpenter, boat maker, armourer, blacksmith, hammer and tool kit maker, locksmith, sculptor/stone carver/stone breaker, goldsmith, potter, cobbler/footwear artisan, mason, basket/mat/broom maker/coir weaver, traditional doll and toy maker, barber, garland maker, washerman, tailor, or fishing net maker.',
      'You must not have taken loans under similar Central or State credit-based schemes for self-employment (e.g. PMEGP, PM SVANidhi, Mudra) in the past 5 years.',
      'Registration and benefits are limited to one member per family (husband, wife and unmarried children). People in government service and their family members are not eligible.',
    ],
    requiredDocuments: [DOC.identity, DOC.bank, { docId: 'ration-card', name: 'Ration card (family details)', optional: true }],
    applicationSteps: [
      'Visit a Common Service Centre (CSC) to register on the PM Vishwakarma portal with biometric authentication.',
      'Your application is verified at the gram panchayat / urban local body, district and state levels.',
      'After approval, attend skill verification and training to access the other benefits.',
    ],
    officialSourceUrl: 'https://pmvishwakarma.gov.in',
    applicationUrl: 'https://pmvishwakarma.gov.in',
    ...verified('the official PM Vishwakarma portal (pmvishwakarma.gov.in: Eligibility Criteria, Eligible Trades and Scheme Benefits sections). Corrected: exact benefit amounts, the list of 18 trades and the "past 5 years" rule for earlier loans.'),
  },
  // ======================= FINANCIAL ASSISTANCE =======================
  {
    name: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    slug: 'pm-kisan',
    shortDescription: 'Income support of ₹6,000 per year to eligible landholding farmer families.',
    description:
      'PM-KISAN is a central sector scheme providing income support to landholding farmer families across the country. The benefit is transferred directly to bank accounts in three equal instalments. State governments and UT administrations identify the eligible farmer families as per the scheme guidelines.',
    category: 'financial_assistance',
    tags: ['farmer', 'agriculture', 'income support', 'DBT'],
    provider: 'Ministry of Agriculture & Farmers Welfare',
    providerType: 'central_government',
    isAllIndia: true,
    benefitType: 'cash_transfer',
    benefitSummary: '₹6,000 per year, paid in three equal instalments by direct benefit transfer.',
    benefits: ['₹6,000 per year per eligible landholding farmer family, in three equal instalments.'],
    eligibilityRules: all(eq('occupation', 'farmer')),
    additionalCriteria: [
      'Your family must hold cultivable land as per state land records.',
      'Excluded: institutional landholders, and families with a former or present holder of a constitutional post, minister, MP, MLA/MLC, mayor of a municipal corporation or district panchayat chairperson.',
      'Excluded: serving or retired employees of central/state government, PSUs, autonomous bodies and regular local body employees, and retired pensioners with a monthly pension of ₹10,000 or more (Multi Tasking Staff / Class IV / Group D employees are not excluded).',
      'Excluded: anyone who paid income tax in the last assessment year, and practising registered doctors, engineers, lawyers, chartered accountants and architects.',
    ],
    requiredDocuments: [DOC.identity, { docId: 'land-records', name: 'Land ownership records' }, DOC.bank],
    applicationSteps: [
      'Register through the PM-KISAN portal (New Farmer Registration), a Common Service Centre, or your state\'s nodal officer.',
      'Your details are verified by the state government.',
      'Complete e-KYC as required to receive instalments.',
    ],
    officialSourceUrl: 'https://pmkisan.gov.in',
    applicationUrl: 'https://pmkisan.gov.in',
    ...verified('the official PM-KISAN portal (pmkisan.gov.in: About, Scheme Exclusion). Corrected: the full official exclusion list.'),
  },
  {
    name: 'PM Street Vendor\'s AtmaNirbhar Nidhi (PM SVANidhi)',
    slug: 'pm-svanidhi',
    shortDescription: 'Collateral-free working capital loans for street vendors, with interest subsidy and digital cashback.',
    description:
      'PM SVANidhi, under the Ministry of Housing and Urban Affairs, provides affordable, collateral-free working capital loans to street vendors to restart and grow their businesses, with higher loan amounts on timely repayment, an interest subsidy and incentives for digital transactions. The portal now also offers a PM SVANidhi credit card for vendors who have repaid the second tranche.',
    category: 'financial_assistance',
    tags: ['street vendor', 'loan', 'working capital', 'urban'],
    provider: 'Ministry of Housing and Urban Affairs',
    providerType: 'central_government',
    isAllIndia: true,
    benefitType: 'loan',
    benefitSummary: 'Collateral-free working capital loans in increasing tranches, with interest subsidy and digital cashback.',
    benefits: ['Successive collateral-free loans, with a higher amount available after timely repayment (loan limits have been enhanced — check the portal for current tranche amounts).', 'Interest subsidy on timely repayment.', 'Cashback incentives for digital transactions.', 'A PM SVANidhi credit card for vendors who have repaid the second tranche.'],
    eligibilityRules: all(eq('occupation', 'street_vendor')),
    additionalCriteria: ['You must hold a Certificate of Vending / ID card issued by the urban local body, or be identified in its survey, or hold a Letter of Recommendation, as per scheme rules. The portal states that vendors in Census Towns are now also eligible.'],
    requiredDocuments: [DOC.identity, { docId: 'vending-certificate', name: 'Certificate of Vending / vendor ID or Letter of Recommendation' }, DOC.bank],
    applicationSteps: [
      'Apply on the PM SVANidhi portal yourself, or through a Common Service Centre or a lending institution.',
      'Your application is verified by the urban local body.',
      'The lender sanctions and disburses the loan to your account.',
    ],
    officialSourceUrl: 'https://pmsvanidhi.mohua.gov.in',
    applicationUrl: 'https://pmsvanidhi.mohua.gov.in',
    ...needsReview('the official portal (pmsvanidhi.mohua.gov.in) announces "enhanced loan amount limits", Census Town eligibility and a credit card facility, but its downloadable FAQ still describes the earlier ₹10,000 first loan and no current guideline stating the new tranche amounts could be found.'),
  },
  {
    name: 'Pradhan Mantri Mudra Yojana (PMMY)',
    slug: 'pradhan-mantri-mudra-yojana',
    shortDescription: 'Collateral-free loans up to ₹20 lakh for non-corporate, non-farm micro and small enterprises.',
    description:
      'Under PMMY, launched on 8 April 2015, member lending institutions provide loans to non-corporate, non-farm small and micro enterprises for income generation and employment creation in manufacturing, services, retail and agri-allied activities. MUDRA has four products — Shishu, Kishor, Tarun and Tarun Plus — reflecting the stage of growth and funding needs of the enterprise.',
    category: 'financial_assistance',
    tags: ['loan', 'business', 'entrepreneur', 'MUDRA', 'self-employed'],
    provider: 'Department of Financial Services, Ministry of Finance',
    providerType: 'central_government',
    isAllIndia: true,
    benefitType: 'loan',
    benefitSummary: 'Business loans up to ₹10 lakh (₹20 lakh under Tarun Plus) under the Shishu, Kishor, Tarun and Tarun Plus categories.',
    benefits: [
      'Shishu: loans up to ₹50,000.',
      'Kishor: loans above ₹50,000 and up to ₹5 lakh.',
      'Tarun: loans above ₹5 lakh and up to ₹10 lakh.',
      'Tarun Plus: loans above ₹10 lakh and up to ₹20 lakh, for entrepreneurs who have availed and successfully repaid previous Tarun loans.',
    ],
    // The official site states no age or employment-status rule that a profile could check, so
    // there are no automated conditions: the result is always "More information needed".
    eligibilityRules: all(),
    additionalCriteria: [
      'The loan is for a non-corporate, non-farm small or micro enterprise engaged in an income-generating activity (manufacturing, services, retail or agri-allied activities).',
      'Tarun Plus is only for borrowers who have availed and successfully repaid an earlier Tarun loan.',
      'The lending institution appraises your proposal under its own norms.',
    ],
    requiredDocuments: [DOC.identity, { docId: 'address-proof', name: 'Proof of residence' }, { docId: 'business-plan', name: 'Business plan / quotation of machinery or items to be purchased' }, DOC.photo],
    applicationSteps: [
      'Approach a bank, NBFC or MFI branch, or apply through the Udyamimitra portal.',
      'Submit the application with your business plan and documents.',
      'The lender appraises the proposal and sanctions the loan.',
    ],
    officialSourceUrl: 'https://www.mudra.org.in',
    applicationUrl: 'https://www.mudra.org.in',
    ...verified('the official MUDRA website (mudra.org.in: PMMY overview and the Shishu / Kishor / Tarun / TarunPlus product description). Corrected: added the Tarun Plus category (up to ₹20 lakh); removed the age and employment-status rules and the "not a defaulter" condition, which the official page does not state.'),
  },
  {
    name: 'Stand-Up India',
    slug: 'stand-up-india',
    shortDescription: 'Bank loans between ₹10 lakh and ₹1 crore for SC/ST and women entrepreneurs setting up a new enterprise.',
    description:
      'Stand-Up India facilitates bank loans between ₹10 lakh and ₹1 crore to at least one Scheduled Caste or Scheduled Tribe borrower and at least one woman borrower per bank branch, for setting up a greenfield enterprise in manufacturing, services, agri-allied activities or the trading sector.',
    category: 'women_empowerment',
    tags: ['entrepreneur', 'women', 'SC', 'ST', 'loan', 'startup'],
    provider: 'Department of Financial Services, Ministry of Finance',
    providerType: 'central_government',
    isAllIndia: true,
    benefitType: 'loan',
    benefitSummary: 'Composite bank loan between ₹10 lakh and ₹1 crore for a new (greenfield) enterprise.',
    benefits: ['Composite loan (term loan and working capital) between ₹10 lakh and ₹1 crore.', 'Handholding support through the Stand-Up Mitra portal.'],
    // Either SC/ST or a woman — a good example of an OR group.
    eligibilityRules: all(ageAtLeast(18), any(isIn('socialCategory', ['sc', 'st']), eq('gender', 'female'))),
    additionalCriteria: [
      'The loan is only for setting up a greenfield (first-time) enterprise in manufacturing, services, agri-allied activities or trading.',
      'For non-individual enterprises, at least 51% of the shareholding and controlling stake must be held by an SC/ST person or a woman entrepreneur.',
      'A margin money contribution is required (the portal mentions 15%).',
    ],
    requiredDocuments: [DOC.identity, { ...DOC.caste, optional: true, description: 'Only for SC/ST applicants.' }, { docId: 'project-report', name: 'Project report / business plan' }, { docId: 'address-proof', name: 'Proof of residence' }],
    applicationSteps: [
      'Register on the Stand-Up Mitra portal or approach a scheduled commercial bank branch directly.',
      'Submit your project details and documents.',
      'The bank appraises your proposal and sanctions the loan.',
    ],
    officialSourceUrl: 'https://www.standupmitra.in',
    applicationUrl: 'https://www.standupmitra.in',
    ...verified('the official Stand-Up Mitra portal (standupmitra.in): loan range, SC/ST or woman borrower above 18 years, greenfield enterprise, 51% shareholding rule and composite loan. Corrected: removed the "not a defaulter" condition (not stated on the official page) and made the caste certificate SC/ST-only.'),
  },
  // ======================= SOCIAL WELFARE =======================
  {
    name: 'Pradhan Mantri Shram Yogi Maan-dhan (PM-SYM)',
    slug: 'pm-shram-yogi-maandhan',
    shortDescription: 'Voluntary, contributory pension scheme for unorganised workers aged 18 to 40 earning up to ₹15,000 a month.',
    description:
      'PM-SYM is a voluntary and contributory pension scheme of the Ministry of Labour & Employment that provides an assured pension of ₹3,000 a month to unorganised workers at the age of 60. The subscriber\'s monthly contribution depends on the age of entry and is matched equally by the central government.',
    category: 'social_welfare',
    tags: ['pension', 'unorganised worker', 'old age', 'labour'],
    provider: 'Ministry of Labour & Employment',
    providerType: 'central_government',
    isAllIndia: true,
    benefitType: 'pension',
    benefitSummary: 'Assured pension of ₹3,000 per month after age 60.',
    benefits: ['Assured pension of ₹3,000 per month after the age of 60.', 'The central government contributes an amount equal to the subscriber\'s contribution.', 'Family pension for the spouse as per scheme rules.'],
    eligibilityRules: all(
      ageAtLeast(18),
      ageAtMost(40),
      isIn('occupation', ['agricultural_labourer', 'construction_worker', 'street_vendor', 'artisan_craftsperson', 'unorganised_worker', 'farmer']),
    ),
    additionalCriteria: [
      'Your monthly income must be ₹15,000 or less.',
      'Not confirmed from the official site: members of EPF/NPS/ESIC and income-tax payers are commonly documented as excluded — check before enrolling.',
    ],
    requiredDocuments: [DOC.identity, DOC.bank],
    applicationSteps: [
      'Visit a Common Service Centre with your identity proof and bank details, or self-enrol on the Maandhan portal.',
      'Choose the auto-debit option for the monthly contribution.',
      'You receive a Shram Yogi pension account number and card.',
    ],
    officialSourceUrl: 'https://maandhan.in',
    applicationUrl: 'https://maandhan.in',
    ...needsReview('maandhan.in confirms entry age 18–40, monthly income up to ₹15,000 and the ₹3,000 monthly pension, but the EPF/NPS/ESIC and income-tax exclusions could not be found on the official site, so the record is not fully confirmed.'),
  },
  {
    name: 'Atal Pension Yojana (APY)',
    slug: 'atal-pension-yojana',
    shortDescription: 'Guaranteed monthly pension of ₹1,000 to ₹5,000 after age 60, based on contribution.',
    description:
      'Atal Pension Yojana, administered by PFRDA, is a voluntary, periodic contribution-based pension system open to Indian citizens aged 18 to 40 with a savings bank account in a bank or the Department of Posts. The pension amount at age 60 depends on the contribution and the age at joining.',
    category: 'social_welfare',
    tags: ['pension', 'old age', 'savings', 'PFRDA'],
    provider: 'Pension Fund Regulatory and Development Authority (PFRDA)',
    providerType: 'statutory_body',
    isAllIndia: true,
    benefitType: 'pension',
    benefitSummary: 'Central Government guaranteed minimum monthly pension of ₹1,000, ₹2,000, ₹3,000, ₹4,000 or ₹5,000 after age 60.',
    benefits: [
      'Guaranteed minimum pension of ₹1,000–₹5,000 per month after age 60, until death.',
      'After the subscriber\'s death, the spouse receives the same pension until their death.',
      'After both have died, the nominee receives the pension wealth accumulated up to the subscriber\'s age 60.',
    ],
    eligibilityRules: all(ageAtLeast(18), ageAtMost(40)),
    additionalCriteria: ['You need a savings bank account in a bank or with the Department of Posts.', 'From 1 October 2022, anyone who is or has been an income-tax payer cannot join.'],
    requiredDocuments: [DOC.identity, DOC.bank],
    applicationSteps: [
      'Fill the APY Registration Form, available at bank branches and post offices (some banks also offer online enrolment).',
      'Submit it to the bank branch or post office where you hold your savings account and choose your pension amount.',
      'Contributions are auto-debited from your account until age 60.',
    ],
    officialSourceUrl: 'https://www.pfrda.org.in/schemes/atal-pension-yojana-apy',
    applicationUrl: null,
    ...verified('the PFRDA scheme page for Atal Pension Yojana (pfrda.org.in/schemes/atal-pension-yojana-apy: Eligibility & Administration, benefits). Corrected: source URL now points to the scheme page; benefit wording aligned with the official text.'),
  },
  {
    name: 'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (AB PM-JAY)',
    slug: 'ayushman-bharat-pm-jay',
    shortDescription: 'Health cover of up to ₹5 lakh per family per year for secondary and tertiary hospital care.',
    description:
      'AB PM-JAY, implemented by the National Health Authority, provides cashless health cover for secondary and tertiary care hospitalisation at empanelled hospitals to eligible families. Eligibility is based on deprivation and occupational criteria from notified databases; the scheme has also been extended to senior citizens aged 70 and above.',
    category: 'social_welfare',
    tags: ['health', 'insurance', 'hospital', 'Ayushman'],
    provider: 'National Health Authority, Ministry of Health & Family Welfare',
    providerType: 'central_government',
    isAllIndia: true,
    benefitType: 'insurance',
    benefitSummary: 'Cashless health cover of up to ₹5 lakh per family per year at empanelled hospitals.',
    benefits: ['Cashless and paperless treatment at empanelled public and private hospitals.', 'Covers pre-hospitalisation and post-hospitalisation expenses as per the scheme packages.'],
    // Eligibility comes from notified databases that SchemeSetu cannot check from a profile.
    eligibilityRules: all(),
    additionalCriteria: [
      'Eligibility is determined from notified databases (such as SECC 2011 deprivation and occupational criteria) and state lists — check using the beneficiary portal.',
      'Senior citizens aged 70 and above are covered under the extension of the scheme; check the portal for current rules.',
    ],
    requiredDocuments: [DOC.identity, { docId: 'ration-card', name: 'Ration card / family identification', optional: true }],
    applicationSteps: [
      'Check your eligibility on the beneficiary portal or at an empanelled hospital / Common Service Centre.',
      'Complete e-KYC to get your Ayushman card.',
      'Use the card for cashless treatment at empanelled hospitals.',
    ],
    officialSourceUrl: 'https://nha.gov.in',
    applicationUrl: 'https://beneficiary.nha.gov.in',
    ...needsReview('nha.gov.in and pmjay.gov.in timed out from the audit environment, and nha.gov.in/PM-JAY and beneficiary.nha.gov.in returned only an empty application shell, so no official text could be read.'),
  },
  // ======================= STATE SCHEMES =======================
  {
    name: 'Kanyashree Prakalpa',
    slug: 'kanyashree-prakalpa-west-bengal',
    shortDescription: 'West Bengal conditional cash transfer to encourage girls to stay in education and delay marriage.',
    description:
      'Kanyashree Prakalpa is a Government of West Bengal conditional cash transfer scheme with two incentives — the K1 annual scholarship and the K2 one-time grant — to keep teenage girls (Class 8 onwards) in education and delay marriage until at least 18, with direct bank transfers.',
    category: 'women_empowerment',
    tags: ['girls', 'West Bengal', 'cash transfer', 'education'],
    provider: 'Department of Women & Child Development and Social Welfare, Government of West Bengal',
    providerType: 'state_government',
    isAllIndia: false,
    applicableStates: ['West Bengal'],
    educationLevels: ['class_1_8', 'class_9_10', 'class_11_12', 'iti', 'diploma', 'undergraduate'],
    benefitType: 'cash_transfer',
    benefitSummary: 'Annual scholarship (K1) for girls aged 13–18 in education and a one-time grant (K2) at 18.',
    benefits: ['K1: annual scholarship for unmarried girls aged 13 to 18 enrolled in education.', 'K2: one-time grant for unmarried girls aged 18 to 19 who are in education or training — check the portal for current amounts.'],
    eligibilityRules: all(eq('gender', 'female'), ageAtLeast(13), ageAtMost(19)),
    additionalCriteria: [
      'You must be unmarried.',
      'You must be enrolled in Class 8 or above in a recognised institution, or in vocational/sports training, as per scheme rules.',
      'Older official guidelines set a family income limit (₹1.2 lakh a year, with exceptions) — check whether an income limit applies this year.',
    ],
    requiredDocuments: [DOC.identity, { docId: 'birth-certificate', name: 'Birth certificate' }, DOC.admission, DOC.bank, { docId: 'unmarried-declaration', name: 'Declaration of unmarried status' }],
    applicationSteps: [
      'Collect the application form (K1 or K2) from your school/institution or apply as notified by the state.',
      'Submit the form with documents through your institution.',
      'After verification, the amount is credited to your bank account.',
    ],
    officialSourceUrl: 'https://kanyashree.wb.gov.in',
    applicationUrl: 'https://kanyashree.wb.gov.in',
    ...needsReview('the new official portal kanyashree.wb.gov.in confirms the K1/K2 structure and Class 8+ focus, but its FAQ and eligibility pages load dynamically and could not be read; wbkanyashree.gov.in (older guideline PDFs) timed out. Amounts, age window and any income limit are not confirmed.'),
  },
  {
    name: 'Swami Vivekananda Merit-cum-Means Scholarship (SVMCM)',
    slug: 'svmcm-west-bengal',
    shortDescription: 'West Bengal scholarship of ₹1,000–₹8,000 a month for meritorious students from Class 11 to PhD.',
    description:
      'SVMCM, run by the Higher Education Department of the Government of West Bengal, helps meritorious students from economically backward families pursue higher studies at institutions in West Bengal — Class 11–12, undergraduate (Arts, Science, Commerce, Engineering, Medical and other professional courses), polytechnic diplomas, post-graduate studies, and non-NET M.Phil/PhD research. Awards are made by merit within the available funds.',
    category: 'education',
    tags: ['West Bengal', 'merit', 'scholarship', 'SVMCM'],
    provider: 'Higher Education Department, Government of West Bengal',
    providerType: 'state_government',
    isAllIndia: false,
    applicableStates: ['West Bengal'],
    educationLevels: ['class_11_12', 'diploma', 'undergraduate', 'postgraduate', 'doctoral'],
    benefitType: 'scholarship',
    benefitSummary: 'Monthly scholarship from ₹1,000 to ₹8,000 depending on the course.',
    benefits: [
      'Class 11–12 (HS): ₹1,000 per month. D.El.Ed: ₹1,000 per month.',
      'UG Arts / Commerce: ₹1,000 per month. UG Science and other UGC-approved professional courses: ₹1,500 per month. Polytechnic diploma: ₹1,500 per month.',
      'PG Arts / Commerce: ₹2,000 per month. PG Science and other professional courses: ₹2,500 per month.',
      'UG/PG Engineering and other AICTE-approved professional courses, and UG medical degrees: ₹5,000 per month (medical diplomas ₹1,500).',
      'Non-NET M.Phil: ₹5,000 per month; non-NET PhD: ₹8,000 per month.',
    ],
    eligibilityRules: all(
      any(
        // Class 11 to UG (incl. polytechnic diploma): 60% in the last qualifying exam, income up to ₹2.5 lakh.
        all(isIn('educationLevel', ['class_11_12', 'diploma', 'undergraduate']), marksAtLeast(60), incomeAtMost(250000)),
        // PG: at least 53% in the Honours subject (55% for engineering — listed below), income up to ₹2.5 lakh.
        all(eq('educationLevel', 'postgraduate'), marksAtLeast(53), incomeAtMost(250000)),
        // M.Phil/PhD research scholars: the income ceiling does not apply.
        eq('educationLevel', 'doctoral'),
      ),
    ),
    additionalCriteria: [
      'You must be domiciled in West Bengal and study in regular mode at an institution in West Bengal; Class 11 applicants must have passed Madhyamik (WBBSE).',
      'There must be no year gap since your qualifying examination.',
      'PG applicants in engineering/technology/pharmacy need 55% in graduation; B.Ed and similar training courses need 53% (50% for renewal).',
      'M.Phil/PhD support is for non-NET and NET-lectureship full-time scholars registered on or after 01-04-2017 at state-aided institutions.',
      'Girls who received Kanyashree (K2) can apply for PG with 45% under the K3 category without an income limit.',
      'You cannot hold any other government scholarship or stipend for the same course.',
    ],
    requiredDocuments: [DOC.identity, DOC.domicile, DOC.income, DOC.marksheet, DOC.admission, DOC.bank],
    applicationSteps: [
      'Register on the SVMCM portal (svmcm.wb.gov.in) when applications open, choosing "Topper" or "Non-Topper".',
      'Fill the application and upload documents; no hard copy is needed.',
      'Your institution verifies the application; scholarships are sanctioned by merit within available funds and paid by direct benefit transfer.',
    ],
    officialSourceUrl: 'https://svmcm.wb.gov.in/page/about.php',
    applicationUrl: 'https://svmcm.wb.gov.in',
    ...verified('the official SVMCM portal (svmcm.wb.gov.in: About Us (Guidelines) and FAQ). Corrected: separate marks thresholds for PG (53%/55%) instead of 60% for everyone; no income ceiling for M.Phil/PhD; ITI removed (not covered); exact monthly rates added; portal address updated (svmcm.wbhed.gov.in did not respond).'),
  },
  {
    name: 'Bihar Student Credit Card Scheme',
    slug: 'bihar-student-credit-card',
    shortDescription: 'Education loan of up to ₹4 lakh for Bihar students pursuing higher education after Class 12.',
    description:
      'Under the Government of Bihar\'s Saat Nishchay programme, the Bihar Student Credit Card Scheme (in operation since 2 October 2016) provides education loans to students of Bihar who have passed Class 12 to pursue higher education, with the state government guaranteeing loans of up to ₹4 lakh.',
    category: 'education',
    tags: ['Bihar', 'education loan', 'credit card', 'higher education'],
    provider: 'Government of Bihar',
    providerType: 'state_government',
    isAllIndia: false,
    applicableStates: ['Bihar'],
    educationLevels: ['diploma', 'undergraduate', 'postgraduate'],
    benefitType: 'loan',
    benefitSummary: 'Education loan of up to ₹4 lakh for higher studies.',
    benefits: ['Education loan of up to ₹4 lakh covering course and related living expenses, on concessional terms as per scheme rules.'],
    eligibilityRules: all(isIn('educationLevel', ['diploma', 'undergraduate', 'postgraduate'])),
    additionalCriteria: [
      'You must be a resident of Bihar who passed Class 12 from Bihar, and be enrolled (or selected) at a recognised institution.',
      'The original 2016 guideline sets a maximum age of 25 on the date of application — check the portal for any later change.',
    ],
    requiredDocuments: [DOC.identity, DOC.domicile, DOC.marksheet, DOC.admission, DOC.fee, DOC.bank, DOC.photo],
    applicationSteps: [
      'Apply online on the 7 Nishchay Yuva Upmission portal.',
      'Visit your District Registration and Counselling Centre (DRCC) with original documents for verification.',
      'After approval, the loan is processed for disbursement.',
    ],
    officialSourceUrl: 'https://www.7nishchay-yuvaupmission.bihar.gov.in',
    applicationUrl: 'https://www.7nishchay-yuvaupmission.bihar.gov.in',
    ...needsReview('the official portal links only the original 2016 guideline (resources/Student_credit_card_guideline.pdf), which confirms the ₹4 lakh limit, Class 12 from Bihar and a maximum age of 25. Later amendments (interest rate, age limits) are not published there, so current terms are not confirmed.'),
  },
  {
    name: 'Pudhumai Penn Scheme (Moovalur Ramamirtham Ammaiyar Higher Education Assurance Scheme)',
    slug: 'pudhumai-penn-tamil-nadu',
    shortDescription: 'Tamil Nadu monthly assistance of ₹1,000 for girls from government schools pursuing higher education.',
    description:
      'A Government of Tamil Nadu scheme, announced in the 2022 budget, that pays ₹1,000 a month to girl students who studied from Class 6 to Class 12 in government schools, until they complete their first undergraduate degree, diploma or ITI course, to raise the enrolment of girls in higher education.',
    category: 'women_empowerment',
    tags: ['Tamil Nadu', 'girls', 'higher education', 'monthly assistance'],
    provider: 'Social Welfare & Women Empowerment Department, Government of Tamil Nadu',
    providerType: 'state_government',
    isAllIndia: false,
    applicableStates: ['Tamil Nadu'],
    educationLevels: ['iti', 'diploma', 'undergraduate'],
    benefitType: 'cash_transfer',
    benefitSummary: '₹1,000 per month until completion of the first higher education course.',
    benefits: ['₹1,000 per month by direct benefit transfer until uninterrupted completion of the first UG degree, diploma or ITI course.', 'Available in addition to other scholarships, and to any number of girls in a family.'],
    eligibilityRules: all(eq('gender', 'female'), isIn('educationLevel', ['iti', 'diploma', 'undergraduate'])),
    additionalCriteria: [
      'You must have studied from Class 6 to Class 12 in government schools.',
      'Only your first course of higher education, at a recognised institution, is covered.',
    ],
    requiredDocuments: [DOC.identity, DOC.marksheet, { docId: 'school-study-certificate', name: 'Certificate of study in government school (Class 6–12)' }, DOC.admission, DOC.bank],
    applicationSteps: [
      'Apply directly on the online portal "Penkalvi" (pudhumaipenn.tn.gov.in).',
      'Your institution certifies your bonafide status (every six months).',
      'Monthly assistance is credited to your bank account.',
    ],
    officialSourceUrl: 'https://www.tnsocialwelfare.tn.gov.in/en/specilisationswoman-welfare/pudhumai-penn',
    applicationUrl: 'https://www.pudhumaipenn.tn.gov.in',
    ...verified('the Tamil Nadu Social Welfare & Women Empowerment Department scheme page (tnsocialwelfare.tn.gov.in/en/specilisationswoman-welfare/pudhumai-penn). Corrected: first-course-only rule, compatibility with other scholarships, and the direct-application route. The application portal pudhumaipenn.tn.gov.in did not respond from the audit environment.'),
  },
];
