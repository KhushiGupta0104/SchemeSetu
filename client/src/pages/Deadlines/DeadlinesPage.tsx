import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDeadlines } from '@/hooks/queries';
import { PageHeader, SectionHeader } from '@/components/common/Layout';
import { EmptyState, ErrorState, Skeleton } from '@/components/common/States';
import { DeadlineBadge, SchemeStatusBadge, VerificationBadge } from '@/components/common/Badges';
import type { SchemeSummary } from '@/types';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/format';

function Row({ s }: { s: SchemeSummary }) {
  return (
    <li className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <Link to={`/schemes/${s.slug}`} className="font-semibold hover:text-brand-700">{s.name}</Link>
        <p className="text-sm text-ink-muted">{s.applicationDeadline ? `Deadline: ${formatDate(s.applicationDeadline)}` : s.provider}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-1.5">
        {s.isDemo && <VerificationBadge status="demo" />}
        <SchemeStatusBadge status={s.windowDisplay} />
        <DeadlineBadge deadline={s.deadline} />
      </div>
    </li>
  );
}

/** Month calendar marking verified deadlines (dates are IST calendar dates stored at UTC midnight). */
function Calendar({ items, today }: { items: SchemeSummary[]; today: string }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date(`${today}T00:00:00Z`);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
  });
  const byDay = useMemo(() => {
    const map = new Map<string, SchemeSummary[]>();
    items.forEach((s) => {
      if (!s.applicationDeadline) return;
      const k = s.applicationDeadline.slice(0, 10);
      map.set(k, [...(map.get(k) ?? []), s]);
    });
    return map;
  }, [items]);

  const first = new Date(Date.UTC(cursor.y, cursor.m, 1));
  const daysInMonth = new Date(Date.UTC(cursor.y, cursor.m + 1, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7; // Monday first
  const cells = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const monthLabel = first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const move = (d: number) => setCursor((c) => ({ y: c.y + Math.floor((c.m + d) / 12), m: (((c.m + d) % 12) + 12) % 12 }));

  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" className="btn-ghost btn-sm px-2" onClick={() => move(-1)} aria-label="Previous month"><ChevronLeft className="h-5 w-5" aria-hidden /></button>
        <h3 className="font-bold" aria-live="polite">{monthLabel}</h3>
        <button type="button" className="btn-ghost btn-sm px-2" onClick={() => move(1)} aria-label="Next month"><ChevronRight className="h-5 w-5" aria-hidden /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-ink-muted" aria-hidden>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d}>{d}</div>)}
      </div>
      <ul className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <li key={`e${i}`} aria-hidden />;
          const key = `${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const hits = byDay.get(key) ?? [];
          const isToday = key === today;
          const past = key < today;
          return (
            <li
              key={key}
              title={hits.map((h) => h.name).join('\n') || undefined}
              className={cn(
                'relative grid aspect-square place-items-center rounded-lg text-sm',
                isToday && 'ring-2 ring-brand-600',
                hits.length ? (past ? 'bg-slate-200 font-bold text-ink-muted' : 'bg-brand-600 font-bold text-white') : 'text-ink-soft',
              )}
            >
              <span>{day}</span>
              {hits.length > 0 && <span className="sr-only">{`: deadline for ${hits.map((h) => h.name).join(', ')}`}</span>}
              {hits.length > 1 && <span className="absolute right-1 top-0.5 text-[0.625rem]" aria-hidden>{hits.length}</span>}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 flex items-center gap-2 text-xs text-ink-muted"><span className="h-3 w-3 rounded bg-brand-600" aria-hidden /> Verified deadline · today is outlined</p>
    </div>
  );
}

export default function DeadlinesPage() {
  const { user } = useAuth();
  const [scope, setScope] = useState<'all' | 'mine'>(user ? 'mine' : 'all');
  const q = useDeadlines(scope);

  return (
    <>
      <PageHeader
        eyebrow="Deadline tracker"
        title="Application deadlines"
        description="Days remaining are counted in Indian Standard Time. A deadline stays open for the whole of its calendar day."
        actions={
          user && (
            <div role="tablist" aria-label="Which schemes" className="inline-flex rounded-xl border border-line bg-white p-1">
              {(['mine', 'all'] as const).map((s) => (
                <button key={s} role="tab" aria-selected={scope === s} type="button" onClick={() => setScope(s)} className={cn('rounded-lg px-3 py-1.5 text-sm font-semibold', scope === s ? 'bg-brand-600 text-white' : 'text-ink-soft')}>
                  {s === 'mine' ? 'Saved & tracked' : 'All schemes'}
                </button>
              ))}
            </div>
          )
        }
      />
      <p className="mb-6 flex gap-2 rounded-xl bg-slate-50 p-3 text-sm text-ink-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        A scheme is only shown as &quot;accepting applications&quot; when an administrator has verified that from the official source — a future deadline alone doesn&apos;t mean it is open. SchemeSetu does not send reminders.
      </p>

      {q.isLoading ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
          <div className="min-w-0 space-y-8">
            <section aria-labelledby="up-title">
              <SectionHeader id="up-title" title={`Upcoming (${q.data!.upcoming.length})`} />
              {q.data!.upcoming.length ? (
                <ul className="card divide-y divide-line">{q.data!.upcoming.map((s) => <Row key={s.id} s={s} />)}</ul>
              ) : (
                <EmptyState icon={<CalendarClock className="h-7 w-7" aria-hidden />} title="No upcoming verified deadlines" description={scope === 'mine' ? 'None of your saved or tracked schemes has a verified upcoming deadline.' : 'No scheme currently has a verified upcoming deadline.'} action={scope === 'mine' && <Link to="/schemes" className="btn-secondary">Find schemes to save</Link>} />
              )}
            </section>
            <section aria-labelledby="unk-title">
              <SectionHeader id="unk-title" title={`Deadline not verified (${q.data!.unknown.length})`} description="Check the official source for the current application window." />
              {q.data!.unknown.length ? <ul className="card divide-y divide-line">{q.data!.unknown.map((s) => <Row key={s.id} s={s} />)}</ul> : <p className="text-sm text-ink-muted">None.</p>}
            </section>
            <section aria-labelledby="exp-title">
              <SectionHeader id="exp-title" title={`Expired (${q.data!.expired.length})`} />
              {q.data!.expired.length ? <ul className="card divide-y divide-line opacity-80">{q.data!.expired.map((s) => <Row key={s.id} s={s} />)}</ul> : <p className="text-sm text-ink-muted">None.</p>}
            </section>
          </div>
          <aside aria-label="Deadline calendar">
            <div className="xl:sticky xl:top-24">
              <Calendar items={[...q.data!.upcoming, ...q.data!.expired]} today={q.data!.today} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
