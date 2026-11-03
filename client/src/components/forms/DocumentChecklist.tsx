import { Check, FileText } from 'lucide-react';
import type { Checklist } from '@/types';
import { useUpdateChecklist } from '@/hooks/queries';
import { ProgressBar } from '@/components/common/Layout';
import { cn } from '@/utils/cn';

/** Checklist of documents to *prepare*. Nothing is uploaded or stored except tick marks. */
export function DocumentChecklist({ checklist }: { checklist: Checklist }) {
  const mutation = useUpdateChecklist(checklist.scheme.id);
  const completed = checklist.documents.filter((d) => d.completed).map((d) => d.docId);

  const toggle = (docId: string, value: boolean) => {
    const next = value ? [...completed, docId] : completed.filter((id) => id !== docId);
    mutation.mutate(next);
  };

  if (!checklist.documents.length)
    return <p className="text-sm text-ink-muted">SchemeSetu has no document list for this scheme. Check the official source.</p>;

  return (
    <div>
      <div className="mb-4">
        <div className="mb-1.5 flex justify-between text-sm">
          <span className="font-semibold">
            {checklist.completedCount} of {checklist.total} prepared
          </span>
          <span className="text-ink-muted">{checklist.total ? Math.round((checklist.completedCount / checklist.total) * 100) : 0}%</span>
        </div>
        <ProgressBar value={checklist.completedCount} max={checklist.total} label={`Documents prepared for ${checklist.scheme.name}`} />
      </div>
      <ul className="space-y-2">
        {checklist.documents.map((d) => (
          <li key={d.docId}>
            <label
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition',
                d.completed ? 'border-success/30 bg-success-soft/40' : 'border-line bg-white hover:border-brand-300',
              )}
            >
              <input type="checkbox" className="peer sr-only" checked={d.completed} onChange={(e) => toggle(d.docId, e.target.checked)} />
              <span
                aria-hidden
                className={cn(
                  'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600 peer-focus-visible:ring-offset-2',
                  d.completed ? 'border-success bg-success text-white' : 'border-slate-300 bg-white',
                )}
              >
                {d.completed && <Check className="h-3.5 w-3.5" />}
              </span>
              <span className="min-w-0">
                <span className={cn('flex items-center gap-2 text-sm font-semibold', d.completed && 'text-ink-soft')}>
                  <FileText className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                  {d.name}
                  {d.optional && <span className="chip bg-slate-100 text-ink-muted">If applicable</span>}
                </span>
                {d.description && <span className="mt-0.5 block text-[0.8125rem] text-ink-muted">{d.description}</span>}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-ink-muted">
        Tick documents as you prepare them. SchemeSetu never asks you to upload documents and stores only your tick marks.
      </p>
    </div>
  );
}
