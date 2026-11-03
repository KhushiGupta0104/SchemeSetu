import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ExternalLink, ListChecks } from 'lucide-react';
import { useChecklist, useChecklists, useMeta } from '@/hooks/queries';
import { PageHeader } from '@/components/common/Layout';
import { EmptyState, ErrorState, Skeleton } from '@/components/common/States';
import { DocumentChecklist } from '@/components/forms/DocumentChecklist';
import { cn } from '@/utils/cn';
import { labelOf } from '@/utils/format';

export default function ChecklistPage() {
  const [sp, setSp] = useSearchParams();
  const list = useChecklists();
  const { data: meta } = useMeta();
  const selected = sp.get('scheme') ?? undefined;
  const detail = useChecklist(selected);

  useEffect(() => {
    if (!selected && list.data?.length) setSp({ scheme: list.data[0].scheme.id }, { replace: true });
  }, [selected, list.data, setSp]);

  return (
    <>
      <PageHeader eyebrow="My SchemeSetu" title="Document checklist" description="Prepare documents for the schemes you are tracking or have saved. Progress is saved to your account — no uploads needed." />
      {list.isLoading ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : !list.data!.length && !selected ? (
        <EmptyState icon={<ListChecks className="h-7 w-7" aria-hidden />} title="No checklists yet" description="Save a scheme or start tracking an application, and its document checklist will appear here." action={<Link to="/schemes" className="btn-primary">Explore schemes</Link>} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
          <nav aria-label="Schemes with checklists">
            <ul className="space-y-2">
              {list.data!.map((c) => (
                <li key={c.scheme.id}>
                  <button
                    type="button"
                    onClick={() => setSp({ scheme: c.scheme.id })}
                    aria-current={selected === c.scheme.id ? 'true' : undefined}
                    className={cn('w-full rounded-2xl border p-3.5 text-left transition', selected === c.scheme.id ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-100' : 'border-line bg-white hover:border-brand-300')}
                  >
                    <p className="line-clamp-2 text-sm font-semibold">{c.scheme.name}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-ink-muted">
                      <span>{c.tracked ? labelOf(meta?.applicationStatuses, c.applicationStatus) : 'Saved'}</span>
                      <span className="font-semibold">{c.completed}/{c.total} ready</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-slate-100" aria-hidden>
                      <div className="h-1.5 rounded-full bg-brand-600" style={{ width: `${c.total ? (c.completed / c.total) * 100 : 0}%` }} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <section className="card p-5 sm:p-6" aria-live="polite">
            {detail.isLoading || !detail.data ? (
              detail.isError ? <ErrorState error={detail.error} onRetry={() => detail.refetch()} /> : <Skeleton className="h-64" />
            ) : (
              <>
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{detail.data.scheme.name}</h2>
                    <Link to={`/schemes/${detail.data.scheme.slug}`} className="link text-sm">View scheme details</Link>
                  </div>
                  <a href={detail.data.scheme.officialSourceUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm">
                    Official requirements <ExternalLink className="h-4 w-4" aria-hidden />
                  </a>
                </div>
                <DocumentChecklist checklist={detail.data} />
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
