import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import type { EligibilityResult } from '../eligibility/types.js';
import { buildFallbackAnswer } from './fallback.js';
import { PRESET_QUESTIONS, SYSTEM_INSTRUCTION, buildUserPrompt, type SchemeDetail } from './prompt.js';

export interface ExplainResult {
  source: 'ai' | 'fallback';
  answer: string;
  notice?: string;
  model?: string;
}

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI | null {
  if (!env.aiEnabled) return null;
  client ??= new GoogleGenAI({ apiKey: env.GEMINI_API_KEY! });
  return client;
}

/** Allows tests to replace the model call without network access. */
export type Generator = (system: string, prompt: string) => Promise<string>;
let generatorOverride: Generator | null = null;
export function __setGenerator(g: Generator | null) {
  generatorOverride = g;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('AI request timed out')), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

async function callGemini(system: string, prompt: string): Promise<string> {
  if (generatorOverride) return generatorOverride(system, prompt);
  const ai = getClient();
  if (!ai) throw new Error('AI not configured');
  const response = await withTimeout(
    ai.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: system,
        temperature: 0.2,
        maxOutputTokens: 2048,
        ...(env.AI_THINKING_BUDGET >= 0 ? { thinkingConfig: { thinkingBudget: env.AI_THINKING_BUDGET } } : {}),
      },
    }),
    env.AI_TIMEOUT_MS,
  );
  return response.text ?? '';
}

const MAX_ANSWER_CHARS = 4000;

export function isAiAvailable(): boolean {
  return Boolean(generatorOverride) || env.aiEnabled;
}

/**
 * Explains a scheme. The AI only sees the verified scheme record and the rule-engine result;
 * it is never the source of truth. On any failure we return a grounded, non-AI summary.
 */
export async function explainScheme(input: {
  scheme: SchemeDetail;
  eligibility: EligibilityResult | null;
  preset?: string;
  question?: string;
}): Promise<ExplainResult> {
  const question = input.question?.trim() || PRESET_QUESTIONS[input.preset ?? 'overview'];
  const fallbackPreset = input.question ? 'overview' : input.preset;

  if (!isAiAvailable()) {
    return {
      source: 'fallback',
      answer: buildFallbackAnswer(input.scheme, input.eligibility, fallbackPreset),
      notice:
        input.preset === 'hindi'
          ? 'AI explanations are not configured, so a Hindi explanation is not available. Here is a summary from the stored scheme details.'
          : 'AI explanations are not configured on this server. Here is a summary built from the stored scheme details.',
    };
  }

  try {
    const text = (await callGemini(SYSTEM_INSTRUCTION, buildUserPrompt(input.scheme, input.eligibility, question))).trim();
    if (!text) throw new Error('Empty AI response');
    return {
      source: 'ai',
      answer: text.length > MAX_ANSWER_CHARS ? `${text.slice(0, MAX_ANSWER_CHARS)}…` : text,
      model: env.GEMINI_MODEL,
    };
  } catch (err) {
    logger.warn({ err: (err as Error).message }, 'AI explanation failed; using fallback');
    return {
      source: 'fallback',
      answer: buildFallbackAnswer(input.scheme, input.eligibility, fallbackPreset),
      notice: 'The AI explainer is temporarily unavailable. Here is a summary built from the stored scheme details.',
    };
  }
}
