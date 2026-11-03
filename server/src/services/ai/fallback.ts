import type { EligibilityResult } from '../eligibility/types.js';
import type { SchemeDetail } from './prompt.js';

const STATUS_TEXT: Record<string, string> = {
  LIKELY_ELIGIBLE: 'Based on your profile, you are **likely eligible** (preliminary check).',
  NOT_ELIGIBLE: 'Based on your profile, you **do not appear to meet** at least one requirement.',
  MORE_INFORMATION_NEEDED: 'We **need more information** to check your eligibility.',
};

const bullets = (items: string[]) => items.map((i) => `- ${i}`).join('\n');
const fmtDate = (d: Date | string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : null;

function eligibilityText(scheme: SchemeDetail, e: EligibilityResult | null): string {
  if (!e) return 'Log in and complete your profile to see a personalised eligibility check.';
  const parts = [STATUS_TEXT[e.status]];
  for (const c of e.criteria) {
    const mark = c.result === 'PASS' ? 'Met' : c.result === 'FAIL' ? 'Not met' : 'Needs information';
    parts.push(`- ${mark}: ${c.requirement}`);
  }
  if (!e.hasAutomatedCriteria) parts.push('This scheme has no conditions SchemeSetu can check automatically.');
  if (scheme.additionalCriteria.length) {
    parts.push('\nAlso check these conditions yourself on the official source:', bullets(scheme.additionalCriteria));
  }
  return parts.join('\n');
}

/**
 * Deterministic, non-AI explanation built only from stored scheme fields. Used when Gemini is
 * not configured or unavailable, so the explainer always gives a grounded answer.
 */
export function buildFallbackAnswer(
  scheme: SchemeDetail,
  eligibility: EligibilityResult | null,
  preset: string | undefined,
): string {
  const source = `Official source: ${scheme.officialSourceUrl}`;
  const deadline = fmtDate(scheme.applicationDeadline);
  const sections: string[] = [];

  switch (preset) {
    case 'eligibility':
      sections.push(eligibilityText(scheme, eligibility));
      break;
    case 'documents':
      sections.push(
        scheme.requiredDocuments.length
          ? `Documents listed for **${scheme.name}**:\n${bullets(scheme.requiredDocuments.map((d) => d.name + (d.optional ? ' (if applicable)' : '')))}`
          : 'SchemeSetu does not have a document list for this scheme. Please check the official source.',
      );
      break;
    case 'apply':
      sections.push(
        scheme.applicationSteps.length
          ? `How to apply:\n${scheme.applicationSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
          : 'SchemeSetu does not have application steps for this scheme. Please check the official source.',
      );
      if (scheme.applicationUrl) sections.push(`Application link: ${scheme.applicationUrl}`);
      break;
    case 'benefits':
      sections.push(`**Benefit:** ${scheme.benefitSummary}`);
      if (scheme.benefits.length) sections.push(bullets(scheme.benefits));
      break;
    default:
      sections.push(`**${scheme.name}** is offered by ${scheme.provider}.`, scheme.description, `**Benefit:** ${scheme.benefitSummary}`);
  }

  sections.push(deadline ? `Deadline on record: ${deadline}.` : 'No verified deadline is on record.');
  if (scheme.isDemo) sections.push('Note: this is a hypothetical demo record, not a real scheme.');
  sections.push(`${source} — always confirm details there before applying.`);
  return sections.join('\n\n');
}
