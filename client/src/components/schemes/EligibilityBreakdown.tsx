import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ClipboardList, Info, MapPin, UserRoundPen } from 'lucide-react';
import type { CriterionResult, EligibilityResult } from '@/types';
import { EligibilityBadge, ResultIcon } from '@/components/common/Badges';
import { useMeta } from '@/hooks/queries';
import { cn } from '@/utils/cn';

const RESULT_TEXT = { PASS: 'Met', FAIL: 'Not met', UNKNOWN: 'Needs information' } as const;
const RESULT_TONE = {
  PASS: 'border-success/20 bg-success-soft/40',
  FAIL: 'border-danger/20 bg-danger-soft/40',
  UNKNOWN: 'border-warning/20 bg-warning-soft/40',
} as const;

function Criterion({ c, depth = 0 }: { c: CriterionResult; depth?: number }) {
  const [open, setOpen] = useState(depth === 0 && c.kind === 'group');
  return (
    <li className={cn('rounded-xl border p-3.5', RESULT_TONE[c.result])}>
      <div className="flex items-start gap-3">
        <ResultIcon result={c.result} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="font-semibold">
              {c.source === 'geography' && <MapPin className="mr-1 inline h-4 w-4 align-[-2px]" aria-hidden />}
              {c.kind === 'group' ? c.requirement : c.label}
            </p>
            <span className="text-xs font-semibold text-ink-muted">· {RESULT_TEXT[c.result]}</span>
          </div>
          {c.kind === 'condition' && <p className="mt-0.5 text-sm text-ink-soft">{c.requirement}.</p>}
          <p className="mt-1 text-sm text-ink-muted">{c.reason}</p>
          {c.kind === 'group' && c.children && (
            <>
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-700"
              >
                {open ? 'Hide' : 'Show'} {c.children.length} options
                <ChevronDown className={cn('h-4 w-4 transition', open && 'rotate-180')} aria-hidden />
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-2 space-y-2 overflow-hidden"
                  >
                    {c.children.map((child, i) => (
                      <Criterion key={i} c={child} depth={depth + 1} />
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

const SUMMARY = {
  LIKELY_ELIGIBLE: 'Based on the details in your profile, you appear to meet every condition SchemeSetu can check for this scheme.',
  NOT_ELIGIBLE: 'Based on your profile, at least one mandatory condition is not met. If your details have changed, update your profile.',
  MORE_INFORMATION_NEEDED: 'No condition rules you out, but some could not be checked with the information in your profile.',
};

export function EligibilityBreakdown({ result }: { result: EligibilityResult }) {
  const { data: meta } = useMeta();
  const fieldLabel = (k: string) => meta?.eligibilityFields.find((f) => f.key === k)?.label ?? k;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <EligibilityBadge status={result.status} size="lg" />
        <span className="text-xs text-ink-muted">
          {result.passed.length} met · {result.failed.length} not met · {result.unknown.length} need information
        </span>
      </div>
      <p className="mt-3 text-sm text-ink-soft" aria-live="polite">
        {result.hasAutomatedCriteria
          ? SUMMARY[result.status]
          : 'This scheme has no conditions SchemeSetu can check automatically. Please read the official eligibility rules.'}
      </p>

      {result.criteria.length > 0 && (
        <ul className="mt-4 space-y-2.5" aria-label="Eligibility criteria">
          {result.criteria.map((c, i) => (
            <Criterion key={i} c={c} />
          ))}
        </ul>
      )}

      {result.missingFields.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-brand-100 bg-brand-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <UserRoundPen className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden />
            <p className="text-sm text-ink-soft">
              Adding <strong>{result.missingFields.map(fieldLabel).join(', ')}</strong> to your profile would help resolve this check.
              Sharing is optional.
            </p>
          </div>
          <Link to="/profile" className="btn-secondary btn-sm shrink-0">
            Update profile
          </Link>
        </div>
      )}

      {result.additionalChecks.length > 0 && (
        <div className="mt-4 rounded-xl border border-line bg-slate-50 p-4">
          <p className="flex items-center gap-2 text-sm font-bold">
            <ClipboardList className="h-4 w-4 text-ink-muted" aria-hidden /> Also check these yourself
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-ink-soft">
            {result.additionalChecks.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 flex gap-2 text-xs text-ink-muted">
        <Info className="h-4 w-4 shrink-0" aria-hidden />
        This is a preliminary, rule-based check using your profile and SchemeSetu&apos;s record of the scheme. It is not an
        official decision — the official source is authoritative.
      </p>
    </div>
  );
}
