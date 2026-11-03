/**
 * Single source of truth for profile options, scheme taxonomies and the fields that
 * eligibility rules may reference. Served to the client via GET /api/v1/meta.
 */

export interface Option {
  value: string;
  label: string;
}

const opts = (pairs: Array<[string, string]>): Option[] => pairs.map(([value, label]) => ({ value, label }));

/** Values that mean "the user has not told us" — always treated as missing by the engine. */
export const UNDISCLOSED_VALUES = ['prefer_not_to_say', 'unknown'] as const;

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
] as const;

export const STATE_OPTIONS: Option[] = INDIAN_STATES.map((s) => ({ value: s, label: s }));

export const GENDERS = opts([
  ['female', 'Female'],
  ['male', 'Male'],
  ['transgender', 'Transgender'],
  ['prefer_not_to_say', 'Prefer not to say'],
]);

export const RESIDENCE_TYPES = opts([
  ['rural', 'Rural'],
  ['urban', 'Urban'],
  ['prefer_not_to_say', 'Prefer not to say'],
]);

export const EDUCATION_LEVELS = opts([
  ['class_1_8', 'School — Class 1 to 8'],
  ['class_9_10', 'School — Class 9 or 10'],
  ['class_11_12', 'School — Class 11 or 12'],
  ['iti', 'ITI / vocational certificate'],
  ['diploma', 'Diploma / polytechnic'],
  ['undergraduate', 'Undergraduate degree'],
  ['postgraduate', 'Postgraduate degree'],
  ['doctoral', 'PhD / doctoral'],
  ['not_studying', 'Not currently studying'],
]);

export const COURSE_STREAMS = opts([
  ['general', 'General (arts / science / commerce)'],
  ['engineering_technical', 'Engineering / technical'],
  ['medical_health', 'Medical / health sciences'],
  ['law', 'Law'],
  ['management', 'Management / commerce professional'],
  ['vocational', 'Vocational / skill-based'],
  ['other', 'Other'],
  ['unknown', 'Not sure'],
]);

export const INSTITUTION_TYPES = opts([
  ['government', 'Government'],
  ['government_aided', 'Government-aided'],
  ['private', 'Private (recognised)'],
  ['other', 'Other'],
  ['unknown', 'Not sure'],
]);

export const EMPLOYMENT_STATUSES = opts([
  ['student', 'Student'],
  ['employed', 'Employed (salaried)'],
  ['self_employed', 'Self-employed / business'],
  ['unemployed', 'Unemployed / looking for work'],
  ['homemaker', 'Homemaker'],
  ['retired', 'Retired'],
  ['prefer_not_to_say', 'Prefer not to say'],
]);

export const OCCUPATIONS = opts([
  ['none', 'None / not applicable'],
  ['farmer', 'Farmer / cultivator'],
  ['agricultural_labourer', 'Agricultural labourer'],
  ['construction_worker', 'Construction worker'],
  ['street_vendor', 'Street vendor'],
  ['artisan_craftsperson', 'Artisan / traditional craftsperson'],
  ['unorganised_worker', 'Other unorganised-sector worker'],
  ['salaried_private', 'Salaried — private sector'],
  ['salaried_government', 'Salaried — government'],
  ['business_owner', 'Business owner / entrepreneur'],
  ['other', 'Other'],
  ['prefer_not_to_say', 'Prefer not to say'],
]);

/**
 * Income brackets (annual family income, INR). Bounds are inclusive. A bracket is an
 * interval, so the eligibility engine can return UNKNOWN when a threshold falls inside it.
 */
export const INCOME_BRACKETS: Array<Option & { min: number; max: number | null }> = [
  { value: 'upto_1l', label: 'Up to ₹1,00,000', min: 0, max: 100000 },
  { value: '1l_2l', label: '₹1,00,001 – ₹2,00,000', min: 100001, max: 200000 },
  { value: '2l_2_5l', label: '₹2,00,001 – ₹2,50,000', min: 200001, max: 250000 },
  { value: '2_5l_3_5l', label: '₹2,50,001 – ₹3,50,000', min: 250001, max: 350000 },
  { value: '3_5l_4_5l', label: '₹3,50,001 – ₹4,50,000', min: 350001, max: 450000 },
  { value: '4_5l_6l', label: '₹4,50,001 – ₹6,00,000', min: 450001, max: 600000 },
  { value: '6l_8l', label: '₹6,00,001 – ₹8,00,000', min: 600001, max: 800000 },
  { value: '8l_12l', label: '₹8,00,001 – ₹12,00,000', min: 800001, max: 1200000 },
  { value: 'above_12l', label: 'Above ₹12,00,000', min: 1200001, max: null },
];
export const INCOME_BRACKET_OPTIONS: Option[] = [
  ...INCOME_BRACKETS.map(({ value, label }) => ({ value, label })),
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export const SOCIAL_CATEGORIES = opts([
  ['general', 'General'],
  ['ews', 'EWS'],
  ['obc', 'OBC'],
  ['sc', 'SC'],
  ['st', 'ST'],
  ['prefer_not_to_say', 'Prefer not to say'],
]);

export const MINORITY_COMMUNITIES = opts([
  ['none', 'Not from a notified minority community'],
  ['muslim', 'Muslim'],
  ['christian', 'Christian'],
  ['sikh', 'Sikh'],
  ['buddhist', 'Buddhist'],
  ['jain', 'Jain'],
  ['parsi', 'Parsi (Zoroastrian)'],
  ['prefer_not_to_say', 'Prefer not to say'],
]);

export const DISABILITY_STATUSES = opts([
  ['none', 'No disability'],
  ['benchmark', 'Disability of 40% or more (benchmark disability)'],
  ['below_benchmark', 'Disability below 40%'],
  ['prefer_not_to_say', 'Prefer not to say'],
]);

// ---------- Scheme taxonomies ----------

export const SCHEME_CATEGORIES = opts([
  ['education', 'Education'],
  ['financial_assistance', 'Financial Assistance'],
  ['women_empowerment', 'Women Empowerment'],
  ['disability_support', 'Disability Support'],
  ['employment_skills', 'Employment & Skills'],
  ['social_welfare', 'Social Welfare'],
]);

export const PROVIDER_TYPES = opts([
  ['central_government', 'Central Government'],
  ['state_government', 'State Government'],
  ['statutory_body', 'Statutory / regulatory body'],
  ['private', 'Private / CSR'],
  ['ngo', 'NGO / Trust'],
]);

export const BENEFIT_TYPES = opts([
  ['scholarship', 'Scholarship'],
  ['fee_reimbursement', 'Fee reimbursement'],
  ['stipend', 'Stipend / fellowship'],
  ['loan', 'Loan / credit'],
  ['cash_transfer', 'Direct cash transfer'],
  ['pension', 'Pension'],
  ['insurance', 'Insurance / health cover'],
  ['training', 'Training / skilling'],
  ['other', 'Other'],
]);

export const VERIFICATION_STATUSES = opts([
  ['verified', 'Verified against official source'],
  ['needs_review', 'Needs review'],
  ['demo', 'Demo record (hypothetical)'],
]);

/** Application window status as confirmed by an admin from the official source. */
export const WINDOW_STATUSES = opts([
  ['open', 'Accepting applications (verified)'],
  ['upcoming', 'Opening soon (verified)'],
  ['closed', 'Closed (verified)'],
  ['not_verified', 'Not verified'],
]);

export const PUBLICATION_STATUSES = opts([
  ['draft', 'Draft'],
  ['published', 'Published'],
]);

export const APPLICATION_STATUSES = opts([
  ['interested', 'Interested'],
  ['preparing_documents', 'Preparing Documents'],
  ['ready_to_apply', 'Ready to Apply'],
  ['applied', 'Applied'],
  ['under_review', 'Under Review'],
  ['approved', 'Approved'],
  ['rejected', 'Rejected'],
  ['closed', 'Closed / Withdrawn'],
]);

export const values = (o: Option[]) => o.map((x) => x.value) as [string, ...string[]];

// ---------- Eligibility fields ----------

export type FieldType = 'enum' | 'number';
export type Unit = 'inr' | 'years' | 'percent' | 'year_of_study';

export interface EligibilityFieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: Option[];
  unit?: Unit;
  /** Why we ask — shown to users in onboarding and in "missing information" hints. */
  hint: string;
}

export const ELIGIBILITY_FIELDS: EligibilityFieldDef[] = [
  { key: 'age', label: 'Age', type: 'number', unit: 'years', hint: 'Many schemes have minimum or maximum age limits.' },
  { key: 'state', label: 'State / UT of domicile', type: 'enum', options: STATE_OPTIONS, hint: 'State schemes are only open to residents of that state.' },
  { key: 'gender', label: 'Gender', type: 'enum', options: GENDERS, hint: 'Some schemes are reserved for girls and women.' },
  { key: 'residenceType', label: 'Residence type', type: 'enum', options: RESIDENCE_TYPES, hint: 'Some programmes target rural residents.' },
  { key: 'educationLevel', label: 'Current education level', type: 'enum', options: EDUCATION_LEVELS, hint: 'Scholarships are usually tied to a level of study.' },
  { key: 'courseStream', label: 'Course stream', type: 'enum', options: COURSE_STREAMS, hint: 'Some scholarships cover only technical or professional courses.' },
  { key: 'institutionType', label: 'Institution type', type: 'enum', options: INSTITUTION_TYPES, hint: 'Some schemes require study at a government or aided institution.' },
  { key: 'academicYear', label: 'Year of study', type: 'number', unit: 'year_of_study', hint: 'Some schemes are only for first-year students.' },
  { key: 'previousExamPercentage', label: 'Marks in last qualifying exam', type: 'number', unit: 'percent', hint: 'Merit-based scholarships set minimum marks.' },
  { key: 'annualIncome', label: 'Annual family income', type: 'number', unit: 'inr', hint: 'Most need-based schemes have a family income ceiling.' },
  { key: 'socialCategory', label: 'Social category', type: 'enum', options: SOCIAL_CATEGORIES, hint: 'Some schemes are for SC, ST, OBC or EWS applicants.' },
  { key: 'minorityCommunity', label: 'Minority community', type: 'enum', options: MINORITY_COMMUNITIES, hint: 'Some schemes are for notified minority communities.' },
  { key: 'disabilityStatus', label: 'Disability status', type: 'enum', options: DISABILITY_STATUSES, hint: 'Disability support schemes usually require 40% or more disability.' },
  { key: 'employmentStatus', label: 'Employment status', type: 'enum', options: EMPLOYMENT_STATUSES, hint: 'Skill and employment schemes often target job seekers.' },
  { key: 'occupation', label: 'Occupation', type: 'enum', options: OCCUPATIONS, hint: 'Some welfare schemes are for specific occupations such as farmers or street vendors.' },
];

export const FIELD_MAP: Record<string, EligibilityFieldDef> = Object.fromEntries(
  ELIGIBILITY_FIELDS.map((f) => [f.key, f]),
);

export const OPERATORS = [
  'equals',
  'notEquals',
  'in',
  'notIn',
  'greaterThan',
  'greaterThanOrEqual',
  'lessThan',
  'lessThanOrEqual',
  'exists',
] as const;
export type Operator = (typeof OPERATORS)[number];

export const OPERATORS_BY_TYPE: Record<FieldType, Operator[]> = {
  enum: ['equals', 'notEquals', 'in', 'notIn', 'exists'],
  number: ['equals', 'notEquals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'exists'],
};

export const OPERATOR_LABELS: Record<Operator, string> = {
  equals: 'is',
  notEquals: 'is not',
  in: 'is one of',
  notIn: 'is none of',
  greaterThan: 'is more than',
  greaterThanOrEqual: 'is at least',
  lessThan: 'is less than',
  lessThanOrEqual: 'is at most',
  exists: 'is provided',
};

export function optionLabel(fieldKey: string, value: unknown): string {
  const def = FIELD_MAP[fieldKey];
  if (fieldKey === 'annualIncome' && typeof value === 'string') {
    return INCOME_BRACKETS.find((b) => b.value === value)?.label ?? String(value);
  }
  if (def?.options) return def.options.find((o) => o.value === value)?.label ?? String(value);
  return String(value);
}

export function formatINR(n: number): string {
  return `₹${n.toLocaleString('en-IN')}`;
}

export function formatNumberForField(fieldKey: string, n: number): string {
  const unit = FIELD_MAP[fieldKey]?.unit;
  if (unit === 'inr') return formatINR(n);
  if (unit === 'percent') return `${n}%`;
  if (unit === 'years') return `${n} years`;
  if (unit === 'year_of_study') return `year ${n}`;
  return String(n);
}
