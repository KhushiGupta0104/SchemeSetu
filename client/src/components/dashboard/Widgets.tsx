import { Link } from 'react-router-dom';
import { Check, UserRoundPen } from 'lucide-react';
import type { ProfileCompletion } from '@/types';
import { cn } from '@/utils/cn';

/** Circular profile completeness indicator with the most useful missing fields. */
export function ProfileCompletionIndicator({ completion, compact = false }: { completion: ProfileCompletion; compact?: boolean }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (completion.percent / 100) * c;
  return (
    <div className="card p-5">
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90" aria-hidden>
            <circle cx="40" cy="40" r={r} fill="none" stroke="#E2E8F0" strokeWidth="8" />
            <circle cx="40" cy="40" r={r} fill="none" stroke="#2563EB" strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} className="transition-[stroke-dashoffset] duration-700" />
          </svg>
          <span className="absolute inset-0 grid place-items-center text-lg font-extrabold">{completion.percent}%</span>
        </div>
        <div>
          <h2 className="font-bold">Profile completeness</h2>
          <p className="text-sm text-ink-muted" role="status">
            {completion.answered} of {completion.total} eligibility questions answered. &quot;Prefer not to say&quot; counts as answered.
          </p>
        </div>
      </div>
      {!compact && completion.missing.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {completion.missing.slice(0, 4).map((m) => (
            <li key={m.key} className="text-sm text-ink-soft">
              <span className="font-semibold">{m.label}</span> <span className="text-ink-muted">— {m.hint}</span>
            </li>
          ))}
        </ul>
      )}
      {!compact && completion.missing.length > 0 && (
        <Link to="/profile" className="btn-secondary btn-sm mt-4 w-full">
          <UserRoundPen className="h-4 w-4" aria-hidden /> Complete your profile
        </Link>
      )}
    </div>
  );
}

const STEPS = ['interested', 'preparing_documents', 'ready_to_apply', 'applied', 'under_review'];

/** Visual progress for a user-maintained application status. */
export function ApplicationStatusStepper({ status, labels }: { status: string; labels: Record<string, string> }) {
  const final = ['approved', 'rejected', 'closed'].includes(status);
  const currentIndex = final ? STEPS.length : STEPS.indexOf(status);
  return (
    <ol className="flex items-center gap-1" aria-label={`Application progress: ${labels[status] ?? status}`}>
      {STEPS.map((s, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        return (
          <li key={s} className="flex flex-1 items-center gap-1" aria-current={current ? 'step' : undefined}>
            <span
              title={labels[s]}
              className={cn(
                'grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.6875rem] font-bold',
                done ? 'bg-brand-600 text-white' : current ? 'bg-brand-100 text-brand-800 ring-2 ring-brand-600' : 'bg-slate-100 text-ink-muted',
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
              <span className="sr-only">{labels[s]}{done ? ' (done)' : current ? ' (current)' : ''}</span>
            </span>
            {i < STEPS.length - 1 && <span className={cn('h-0.5 flex-1 rounded', done ? 'bg-brand-600' : 'bg-slate-200')} aria-hidden />}
          </li>
        );
      })}
      <li className="ml-1">
        <span
          className={cn(
            'chip',
            status === 'approved' ? 'bg-success-soft text-success' : status === 'rejected' ? 'bg-danger-soft text-danger' : status === 'closed' ? 'bg-slate-100 text-ink-muted' : 'bg-slate-50 text-ink-muted',
          )}
        >
          {final ? labels[status] : 'Outcome'}
        </span>
      </li>
    </ol>
  );
}
