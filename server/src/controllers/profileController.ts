import type { Request, Response } from 'express';
import { User } from '../models/User.js';
import { INCOME_BRACKETS } from '../constants/options.js';
import { ApiError } from '../utils/ApiError.js';
import { ok } from '../utils/http.js';
import { profileCompletion } from '../services/recommendations/recommendationService.js';
import type { ProfileInput } from '../services/eligibility/facts.js';

function serializeProfile(p: Record<string, unknown> | undefined | null) {
  const profile = { ...(p ?? {}) } as Record<string, unknown>;
  if (profile.dateOfBirth instanceof Date) profile.dateOfBirth = profile.dateOfBirth.toISOString().slice(0, 10);
  return profile;
}

export async function getProfile(req: Request, res: Response) {
  const user = await User.findById(req.user!.id).lean();
  if (!user) throw ApiError.unauthenticated();
  return ok(res, {
    name: user.name,
    email: user.email,
    profile: serializeProfile(user.profile as Record<string, unknown>),
    onboardingCompleted: Boolean(user.onboardingCompletedAt),
    completion: profileCompletion(user.profile as ProfileInput),
  });
}

export async function updateProfile(req: Request, res: Response) {
  const body = req.body as { name?: string; profile?: Record<string, unknown>; completeOnboarding?: boolean };
  const user = await User.findById(req.user!.id);
  if (!user) throw ApiError.unauthenticated();

  if (body.name) user.name = body.name;
  if (body.profile) {
    const current = { ...((user.toObject().profile ?? {}) as Record<string, unknown>) };
    for (const [key, value] of Object.entries(body.profile)) {
      // null or empty string clears a field; undefined leaves it unchanged.
      if (value === null || value === '') delete current[key];
      else if (value !== undefined) current[key] = key === 'dateOfBirth' ? new Date(`${value}T00:00:00Z`) : value;
    }
    // Date of birth and age are alternatives — keep only the one most recently provided.
    if (body.profile.dateOfBirth) delete current.age;
    else if (typeof body.profile.age === 'number') delete current.dateOfBirth;
    // An exact income (optional) must fall inside the chosen bracket; the exact figure wins in matching.
    const bracket = INCOME_BRACKETS.find((b) => b.value === current.incomeBracket);
    const exact = current.annualIncome;
    if (bracket && typeof exact === 'number' && (exact < bracket.min || (bracket.max !== null && exact > bracket.max))) {
      throw ApiError.badRequest('Your exact annual income does not fall within the income bracket you selected.', [
        { path: 'profile.annualIncome', message: 'Exact income must be within the selected bracket.' },
      ]);
    }
    user.set('profile', current);
  }
  if (body.completeOnboarding && !user.onboardingCompletedAt) user.onboardingCompletedAt = new Date();
  await user.save();

  return ok(res, {
    name: user.name,
    email: user.email,
    profile: serializeProfile(user.toObject().profile as Record<string, unknown>),
    onboardingCompleted: Boolean(user.onboardingCompletedAt),
    completion: profileCompletion(user.toObject().profile as ProfileInput),
  });
}
