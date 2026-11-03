import { Schema, model } from 'mongoose';
import { APPLICATION_STATUSES, values } from '../constants/options.js';

const StatusHistorySchema = new Schema(
  {
    status: { type: String, enum: values(APPLICATION_STATUSES), required: true },
    changedAt: { type: Date, default: () => new Date() },
    note: { type: String, trim: true, maxlength: 300 },
  },
  { _id: false },
);

/**
 * A user-maintained record of their own application progress. SchemeSetu does not submit
 * applications or sync with government portals.
 */
const ApplicationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    schemeId: { type: Schema.Types.ObjectId, ref: 'Scheme', required: true },
    /** Snapshot so the record still makes sense if the scheme is later removed. */
    schemeName: { type: String, required: true, maxlength: 200 },
    status: { type: String, enum: values(APPLICATION_STATUSES), default: 'interested' },
    appliedAt: { type: Date, default: null },
    notes: { type: String, trim: true, maxlength: 2000, default: '' },
    statusHistory: { type: [StatusHistorySchema], default: [] },
  },
  { timestamps: true },
);

ApplicationSchema.index({ userId: 1, schemeId: 1 }, { unique: true });
ApplicationSchema.index({ userId: 1, updatedAt: -1 });

export const Application = model('Application', ApplicationSchema);
