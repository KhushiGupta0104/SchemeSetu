import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import {
  BENEFIT_TYPES,
  EDUCATION_LEVELS,
  INDIAN_STATES,
  PROVIDER_TYPES,
  PUBLICATION_STATUSES,
  SCHEME_CATEGORIES,
  VERIFICATION_STATUSES,
  WINDOW_STATUSES,
  values,
} from '../constants/options.js';

const RequiredDocumentSchema = new Schema(
  {
    /** Stable identifier — checklist progress refers to this, not to the document name. */
    docId: { type: String, required: true, maxlength: 64 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 400 },
    optional: { type: Boolean, default: false },
  },
  { _id: false },
);

const SchemeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 100 },
    shortDescription: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    category: { type: String, required: true, enum: values(SCHEME_CATEGORIES), index: true },
    tags: { type: [String], default: [] },
    provider: { type: String, required: true, trim: true, maxlength: 200 },
    providerType: { type: String, required: true, enum: values(PROVIDER_TYPES), index: true },
    isAllIndia: { type: Boolean, default: true },
    applicableStates: { type: [String], enum: [...INDIAN_STATES], default: [] },
    /** Education levels this scheme targets (discovery filter only; empty = any). */
    educationLevels: { type: [String], enum: values(EDUCATION_LEVELS), default: [] },
    benefitType: { type: String, required: true, enum: values(BENEFIT_TYPES), index: true },
    benefitSummary: { type: String, required: true, trim: true, maxlength: 300 },
    benefits: { type: [String], default: [] },
    /** Structured, validated rule tree interpreted by the eligibility engine (never executed). */
    eligibilityRules: { type: Schema.Types.Mixed, default: () => ({ op: 'all', conditions: [] }) },
    /** Stated conditions that cannot be checked automatically (shown as "verify yourself"). */
    additionalCriteria: { type: [String], default: [] },
    requiredDocuments: { type: [RequiredDocumentSchema], default: [] },
    applicationSteps: { type: [String], default: [] },
    applicationOpenDate: { type: Date, default: null },
    applicationDeadline: { type: Date, default: null, index: true },
    applicationWindowStatus: { type: String, enum: values(WINDOW_STATUSES), default: 'not_verified' },
    officialSourceUrl: { type: String, required: true, trim: true, maxlength: 500 },
    applicationUrl: { type: String, trim: true, maxlength: 500, default: null },
    sourceVerifiedAt: { type: Date, default: null },
    verificationStatus: { type: String, enum: values(VERIFICATION_STATUSES), default: 'needs_review', index: true },
    verificationNotes: { type: String, trim: true, maxlength: 1000 },
    /** True for clearly-labelled hypothetical demonstration records. */
    isDemo: { type: Boolean, default: false, index: true },
    publicationStatus: { type: String, enum: values(PUBLICATION_STATUSES), default: 'draft', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

SchemeSchema.index({ publicationStatus: 1, category: 1, applicationDeadline: 1 });
SchemeSchema.index({ updatedAt: -1 });

SchemeSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret.__v;
    return ret;
  },
});

export type SchemeDoc = HydratedDocument<InferSchemaType<typeof SchemeSchema>>;
export type SchemeLean = InferSchemaType<typeof SchemeSchema> & { _id: unknown; createdAt: Date; updatedAt: Date };
export const Scheme = model('Scheme', SchemeSchema);
