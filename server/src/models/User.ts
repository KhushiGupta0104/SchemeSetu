import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import {
  COURSE_STREAMS,
  DISABILITY_STATUSES,
  EDUCATION_LEVELS,
  EMPLOYMENT_STATUSES,
  GENDERS,
  INCOME_BRACKET_OPTIONS,
  INDIAN_STATES,
  INSTITUTION_TYPES,
  MINORITY_COMMUNITIES,
  OCCUPATIONS,
  RESIDENCE_TYPES,
  SOCIAL_CATEGORIES,
  values,
} from '../constants/options.js';

/**
 * Eligibility profile. Every field is optional: unknown or withheld details are never
 * treated as disqualifying. SchemeSetu never stores Aadhaar, bank or certificate data.
 */
const ProfileSchema = new Schema(
  {
    dateOfBirth: { type: Date },
    age: { type: Number, min: 0, max: 120 },
    state: { type: String, enum: [...INDIAN_STATES] },
    district: { type: String, trim: true, maxlength: 80 },
    gender: { type: String, enum: values(GENDERS) },
    residenceType: { type: String, enum: values(RESIDENCE_TYPES) },
    educationLevel: { type: String, enum: values(EDUCATION_LEVELS) },
    course: { type: String, trim: true, maxlength: 120 },
    courseStream: { type: String, enum: values(COURSE_STREAMS) },
    institutionType: { type: String, enum: values(INSTITUTION_TYPES) },
    academicYear: { type: Number, min: 1, max: 10 },
    previousExamPercentage: { type: Number, min: 0, max: 100 },
    incomeBracket: { type: String, enum: values(INCOME_BRACKET_OPTIONS) },
    annualIncome: { type: Number, min: 0, max: 100_000_000 },
    socialCategory: { type: String, enum: values(SOCIAL_CATEGORIES) },
    minorityCommunity: { type: String, enum: values(MINORITY_COMMUNITIES) },
    disabilityStatus: { type: String, enum: values(DISABILITY_STATUSES) },
    employmentStatus: { type: String, enum: values(EMPLOYMENT_STATUSES) },
    occupation: { type: String, enum: values(OCCUPATIONS) },
  },
  { _id: false },
);

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    /** Incremented on logout-everywhere / password change to revoke refresh tokens. */
    tokenVersion: { type: Number, default: 0, select: false },
    profile: { type: ProfileSchema, default: () => ({}) },
    onboardingCompletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

UserSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret.passwordHash;
    delete ret.tokenVersion;
    delete ret.__v;
    return ret;
  },
});

export type UserDoc = HydratedDocument<InferSchemaType<typeof UserSchema>>;
export type Profile = InferSchemaType<typeof ProfileSchema>;
export const User = model('User', UserSchema);

/** Safe public representation of the current user (never includes the password hash). */
export function toPublicUser(u: UserDoc) {
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    onboardingCompleted: Boolean(u.onboardingCompletedAt),
    createdAt: u.createdAt,
  };
}
