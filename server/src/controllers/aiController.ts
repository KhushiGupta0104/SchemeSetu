import type { Request, Response } from 'express';
import { findPublishedScheme, getUserProfile, toSchemeDetail } from '../services/schemeService.js';
import { evaluateScheme } from '../services/eligibility/engine.js';
import { explainScheme, isAiAvailable } from '../services/ai/aiService.js';
import { ok } from '../utils/http.js';

export async function aiStatus(_req: Request, res: Response) {
  return ok(res, { available: isAiAvailable() });
}

export async function explain(req: Request, res: Response) {
  const { schemeId, preset, question } = req.body as { schemeId: string; preset?: string; question?: string };
  const scheme = await findPublishedScheme(schemeId);
  const profile = req.user ? await getUserProfile(req.user.id) : null;
  const eligibility = req.user ? evaluateScheme(scheme, profile) : null;
  const result = await explainScheme({ scheme: toSchemeDetail(scheme), eligibility, preset, question });
  return ok(res, result);
}
