import { Schema, model } from 'mongoose';

/**
 * Tracks which required documents a user has *prepared* for a scheme. Stores only stable
 * document identifiers — never the documents themselves.
 */
const ChecklistProgressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    schemeId: { type: Schema.Types.ObjectId, ref: 'Scheme', required: true },
    completedDocumentIds: { type: [String], default: [] },
  },
  { timestamps: true },
);

ChecklistProgressSchema.index({ userId: 1, schemeId: 1 }, { unique: true });

export const ChecklistProgress = model('ChecklistProgress', ChecklistProgressSchema);
