import { AlertCircle, BadgeCheck, CalendarClock, CheckCircle2, CircleHelp, FlaskConical, ShieldAlert, XCircle } from 'lucide-react';
import type { DeadlineInfo, EligibilityStatus, WindowDisplay } from '@/types';
import { cn } from '@/utils/cn';
import { daysLabel } from '@/utils/format';

const ELIGIBILITY: Record<EligibilityStatus, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  LIKELY_ELIGIBLE: { label: 'Likely Eligible', className: 'bg-success-soft text-success', Icon: CheckCircle2 },
  MORE_INFORMATION_NEEDED: { label: 'More Info Needed', className: 'bg-warning-soft text-warning', Icon: CircleHelp },
  NOT_ELIGIBLE: { label: 'Not Eligible', className: 'bg-danger-soft text-danger', Icon: XCircle },
};

export function EligibilityBadge({ status, size = 'sm' }: { status: EligibilityStatus; size?: 'sm' | 'lg' }) {
  const s = ELIGIBILITY[status];
  return (
    <span className={cn('chip', s.className, size === 'lg' && 'px-3 py-1 text-sm')}>
      <s.Icon className={size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'} aria-hidden />
      {s.label}
    </span>
  );
}

export function DeadlineBadge({ deadline }: { deadline: DeadlineInfo }) {
  const cls =
    deadline.state === 'unknown'
      ? 'bg-slate-100 text-ink-muted'
      : deadline.state === 'passed'
        ? 'bg-slate-100 text-ink-muted line-through decoration-1'
        : deadline.state === 'due_soon'
          ? 'bg-warning-soft text-warning'
          : 'bg-brand-50 text-brand-700';
  return (
    <span className={cn('chip', cls)}>
      <CalendarClock className="h-3.5 w-3.5" aria-hidden />
      {daysLabel(deadline.daysRemaining)}
    </span>
  );
}

const WINDOW: Record<WindowDisplay, { label: string; className: string }> = {
  open: { label: 'Accepting applications', className: 'bg-success-soft text-success' },
  upcoming: { label: 'Opening soon', className: 'bg-indigo-50 text-indigo-700' },
  closed: { label: 'Closed', className: 'bg-slate-100 text-ink-muted' },
  deadline_passed: { label: 'Deadline passed', className: 'bg-slate-100 text-ink-muted' },
  not_verified: { label: 'Application window not verified', className: 'bg-slate-100 text-ink-muted' },
};

/** Status of the application window — never claims "open" unless an admin verified it. */
export function SchemeStatusBadge({ status }: { status: WindowDisplay }) {
  const s = WINDOW[status];
  return <span className={cn('chip', s.className)}>{s.label}</span>;
}

export function VerificationBadge({ status, verifiedAt }: { status: string; verifiedAt?: string | null }) {
  if (status === 'demo')
    return (
      <span className="chip bg-indigo-50 text-indigo-700" title="Hypothetical demonstration record — not a real scheme">
        <FlaskConical className="h-3.5 w-3.5" aria-hidden /> Demo record
      </span>
    );
  if (status === 'verified')
    return (
      <span className="chip bg-success-soft text-success" title={verifiedAt ? `Verified on ${new Date(verifiedAt).toLocaleDateString('en-IN', { timeZone: 'UTC' })}` : undefined}>
        <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Verified
      </span>
    );
  return (
    <span className="chip bg-amber-50 text-warning" title="Details have not yet been verified against the official source by an administrator">
      <ShieldAlert className="h-3.5 w-3.5" aria-hidden /> Unverified details
    </span>
  );
}

export function ResultIcon({ result, className }: { result: 'PASS' | 'FAIL' | 'UNKNOWN'; className?: string }) {
  if (result === 'PASS') return <CheckCircle2 className={cn('h-5 w-5 text-success', className)} aria-label="Met" />;
  if (result === 'FAIL') return <XCircle className={cn('h-5 w-5 text-danger', className)} aria-label="Not met" />;
  return <AlertCircle className={cn('h-5 w-5 text-warning', className)} aria-label="Needs information" />;
}
