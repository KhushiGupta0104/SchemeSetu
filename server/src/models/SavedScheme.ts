import { Schema, model } from 'mongoose';

const SavedSchemeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    schemeId: { type: Schema.Types.ObjectId, ref: 'Scheme', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// One bookmark per user per scheme.
SavedSchemeSchema.index({ userId: 1, schemeId: 1 }, { unique: true });
SavedSchemeSchema.index({ userId: 1, createdAt: -1 });

export const SavedScheme = model('SavedScheme', SavedSchemeSchema);
