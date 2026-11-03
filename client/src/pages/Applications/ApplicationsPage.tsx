import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ClipboardCheck, History, Info, ListChecks, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useApplications, useDeleteApplication, useMeta, useUpdateApplication } from '@/hooks/queries';
import { PageHeader } from '@/components/common/Layout';
import { EmptyState, ErrorState, Skeleton, Spinner } from '@/components/common/States';
import { ConfirmationDialog } from '@/components/common/Modal';
import { ApplicationStatusStepper } from '@/components/dashboard/Widgets';
import { DeadlineBadge } from '@/components/common/Badges';
import type { Application } from '@/types';
import { formatDate, formatDateTime } from '@/utils/format';

function ApplicationCard({ app, statusOptions }: { app: Application; statusOptions: { value: string; label: string }[] }) {
  const update = useUpdateApplication();
  const del = useDeleteApplication();
  const [notes, setNotes] = useState(app.notes);
  const [showHistory, setShowHistory] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const labels = Object.fromEntries(statusOptions.map((s) => [s.value, s.label]));

  return (
    <motion.li layout className="card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {app.scheme ? (
            <Link to={`/schemes/${app.scheme.slug}`} className="font-bold hover:text-brand-700">{app.schemeName}</Link>
          ) : (
            <p className="font-bold">{app.schemeName} <span className="chip ml-1 bg-slate-100 text-ink-muted">Scheme no longer available</span></p>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
            {app.scheme && <DeadlineBadge deadline={app.scheme.deadline} />}
            {app.checklist && app.checklist.total > 0 && (
              <Link to={`/checklist?scheme=${app.schemeId}`} className="chip bg-slate-100 text-ink-soft hover:bg-brand-50">
                <ListChecks className="h-3.5 w-3.5" aria-hidden /> {app.checklist.completed}/{app.checklist.total} documents
              </Link>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <label htmlFor={`status-${app.id}`} className="sr-only">Status for {app.schemeName}</label>
          <select
            id={`status-${app.id}`}
            className="input min-h-[2.5rem] w-auto py-1.5 text-sm font-semibold"
            value={app.status}
            disabled={update.isPending}
            onChange={(e) => update.mutate({ id: app.id, status: e.target.value }, { onSuccess: () => toast.success(`Status updated to “${labels[e.target.value]}”`) })}
          >
            {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button type="button" className="btn-secondary btn-sm px-2.5 text-danger" onClick={() => setConfirm(true)} aria-label={`Stop tracking ${app.schemeName}`}>
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto pb-1">
        <div className="min-w-[22rem]"><ApplicationStatusStepper status={app.status} labels={labels} /></div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[12rem_1fr]">
        <div>
          <label htmlFor={`applied-${app.id}`} className="label text-xs">Date applied</label>
          <input
            id={`applied-${app.id}`}
            type="date"
            className="input min-h-[2.5rem] text-sm"
            max={new Date().toISOString().slice(0, 10)}
            value={app.appliedAt ? app.appliedAt.slice(0, 10) : ''}
            onChange={(e) => update.mutate({ id: app.id, appliedAt: e.target.value || null })}
          />
        </div>
        <div>
          <label htmlFor={`notes-${app.id}`} className="label text-xs">Personal notes</label>
          <textarea
            id={`notes-${app.id}`}
            rows={2}
            maxLength={2000}
            className="input text-sm"
            placeholder="e.g. Reference number, things to follow up on"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          {notes !== app.notes && (
            <button type="button" className="btn-primary btn-sm mt-2" disabled={update.isPending} onClick={() => update.mutate({ id: app.id, notes }, { onSuccess: () => toast.success('Notes saved') })}>
              {update.isPending && <Spinner />} Save notes
            </button>
          )}
        </div>
      </div>

      <button type="button" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink" aria-expanded={showHistory} onClick={() => setShowHistory((s) => !s)}>
        <History className="h-4 w-4" aria-hidden /> Status history ({app.statusHistory.length})
        <ChevronDown className={`h-4 w-4 transition ${showHistory ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      <AnimatePresence initial={false}>
        {showHistory && (
          <motion.ol initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-2 space-y-2 overflow-hidden border-l-2 border-brand-100 pl-4">
            {[...app.statusHistory].reverse().map((h, i) => (
              <li key={i} className="text-sm">
                <span className="font-semibold">{labels[h.status] ?? h.status}</span>
                <span className="text-ink-muted"> · {formatDateTime(h.changedAt)}</span>
                {h.note && <p className="text-xs text-ink-muted">{h.note}</p>}
              </li>
            ))}
          </motion.ol>
        )}
      </AnimatePresence>

      <ConfirmationDialog
        open={confirm}
        onCancel={() => setConfirm(false)}
        onConfirm={() => del.mutate(app.id, { onSuccess: () => setConfirm(false) })}
        loading={del.isPending}
        title="Stop tracking this application?"
        description="Your status, notes and history for this scheme will be deleted. This does not affect any real application you submitted."
        confirmLabel="Stop tracking"
      />
    </motion.li>
  );
}

export default function ApplicationsPage() {
  const apps = useApplications();
  const { data: meta } = useMeta();

  return (
    <>
      <PageHeader eyebrow="My SchemeSetu" title="Application tracker" description="Keep your own record of where each application stands." />
      <p role="note" className="mb-6 flex gap-2 rounded-xl border border-warning/30 bg-warning-soft/60 p-3.5 text-sm text-ink-soft">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
        Application statuses are maintained by you and are not automatically synchronized with government portals. SchemeSetu does not submit applications.
      </p>
      {apps.isLoading || !meta ? (
        <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div>
      ) : apps.isError ? (
        <ErrorState error={apps.error} onRetry={() => apps.refetch()} />
      ) : !apps.data!.length ? (
        <EmptyState icon={<ClipboardCheck className="h-7 w-7" aria-hidden />} title="You're not tracking any applications" description="Open a scheme and choose “Track Application” to record your progress here." action={<Link to="/schemes" className="btn-primary">Explore schemes</Link>} />
      ) : (
        <>
          <p className="mb-3 text-sm text-ink-muted" role="status">
            {apps.data!.length} tracked · {apps.data!.filter((a) => a.appliedAt).length} with an application date · last updated {formatDate(apps.data![0].updatedAt)}
          </p>
          <ul className="space-y-4">
            {apps.data!.map((a) => <ApplicationCard key={a.id} app={a} statusOptions={meta.applicationStatuses} />)}
          </ul>
        </>
      )}
    </>
  );
}
