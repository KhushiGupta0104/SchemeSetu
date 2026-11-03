import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, ClipboardCheck, ExternalLink, Trash2 } from 'lucide-react';
import { useApplications, useSaved, useToggleSave, useTrackApplication } from '@/hooks/queries';
import { PageHeader } from '@/components/common/Layout';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/common/States';
import { SearchBar } from '@/components/schemes/FilterPanel';
import { DeadlineBadge, VerificationBadge } from '@/components/common/Badges';
import { formatDate, pluralize } from '@/utils/format';

export default function SavedPage() {
  const [q, setQ] = useState('');
  const saved = useSaved(q || undefined);
  const apps = useApplications();
  const remove = useToggleSave();
  const track = useTrackApplication();
  const trackedIds = new Set((apps.data ?? []).map((a) => a.schemeId));

  return (
    <>
      <PageHeader eyebrow="My SchemeSetu" title="Saved schemes" description="Schemes you have bookmarked. Saved to your account, so they're here whenever you log in." />
      <div className="mb-5 max-w-xl">
        <SearchBar value={q} onChange={setQ} placeholder="Search your saved schemes" />
      </div>
      {saved.isLoading ? (
        <LoadingSkeleton count={4} label="Loading saved schemes" />
      ) : saved.isError ? (
        <ErrorState error={saved.error} onRetry={() => saved.refetch()} />
      ) : !saved.data!.length ? (
        <EmptyState
          icon={<Bookmark className="h-7 w-7" aria-hidden />}
          title={q ? 'No saved schemes match your search' : 'You have no saved schemes yet'}
          description={q ? 'Try a different search term.' : 'Tap the bookmark icon on any scheme to keep it here.'}
          action={!q && <Link to="/schemes" className="btn-primary">Explore schemes</Link>}
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-ink-muted" role="status">{pluralize(saved.data!.length, 'saved scheme')}</p>
          <ul className="space-y-3">
            {saved.data!.map((item) => (
              <li key={item.schemeId} className="card flex flex-col gap-4 p-5 md:flex-row md:items-center">
                {item.scheme ? (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-1.5">
                        <DeadlineBadge deadline={item.scheme.deadline} />
                        {item.scheme.isDemo && <VerificationBadge status="demo" />}
                      </div>
                      <Link to={`/schemes/${item.scheme.slug}`} className="mt-2 block font-bold hover:text-brand-700">{item.scheme.name}</Link>
                      <p className="mt-0.5 line-clamp-1 text-sm text-ink-muted">{item.scheme.benefitSummary}</p>
                      <p className="mt-1 text-xs text-ink-muted">Saved on {formatDate(item.savedAt)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/schemes/${item.scheme.slug}`} className="btn-secondary btn-sm">Open details</Link>
                      {trackedIds.has(item.schemeId) ? (
                        <Link to="/applications" className="btn-secondary btn-sm text-brand-700"><ClipboardCheck className="h-4 w-4" aria-hidden /> Tracking</Link>
                      ) : (
                        <button type="button" className="btn-secondary btn-sm" disabled={track.isPending} onClick={() => track.mutate(item.schemeId)}>
                          <ClipboardCheck className="h-4 w-4" aria-hidden /> Track application
                        </button>
                      )}
                      <a href={item.scheme.officialSourceUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm px-2.5" aria-label={`Official source for ${item.scheme.name}`}>
                        <ExternalLink className="h-4 w-4" aria-hidden />
                      </a>
                      <button type="button" className="btn-secondary btn-sm px-2.5 text-danger" aria-label={`Remove ${item.scheme.name} from saved`} disabled={remove.isPending} onClick={() => remove.mutate({ schemeId: item.schemeId, saved: true })}>
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="flex-1 text-sm text-ink-muted">This scheme is no longer available (it may have been unpublished).</p>
                    <button type="button" className="btn-secondary btn-sm" onClick={() => remove.mutate({ schemeId: item.schemeId, saved: true })}>Remove</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
