import { useCallback, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SearchX, SlidersHorizontal, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMeta, useSchemes } from '@/hooks/queries';
import { PageHeader, Pagination } from '@/components/common/Layout';
import { EmptyState, ErrorState, LoadingSkeleton, Skeleton } from '@/components/common/States';
import { AccessibleModal } from '@/components/common/Modal';
import { SchemeCard } from '@/components/schemes/SchemeCard';
import { countActive, EMPTY_FILTERS, FilterPanel, SearchBar, type ExplorerFilters } from '@/components/schemes/FilterPanel';
import { labelOf, pluralize } from '@/utils/format';

const LIST_KEYS = ['category', 'providerType', 'benefitType', 'eligibility'] as const;
const PAGE_SIZE = 12;

function parse(sp: URLSearchParams): ExplorerFilters & { page: number } {
  const list = (k: string) => (sp.get(k) ? sp.get(k)!.split(',').filter(Boolean) : []);
  return {
    q: sp.get('q') ?? '',
    category: list('category'),
    providerType: list('providerType'),
    benefitType: list('benefitType'),
    eligibility: list('eligibility'),
    state: sp.get('state') ?? '',
    educationLevel: sp.get('educationLevel') ?? '',
    hasDeadline: (sp.get('hasDeadline') as ExplorerFilters['hasDeadline']) ?? '',
    acceptingOnly: sp.get('acceptingOnly') === 'true',
    hideDemo: sp.get('hideDemo') === 'true',
    sort: sp.get('sort') ?? 'relevance',
    page: Math.max(1, Number(sp.get('page')) || 1),
  };
}

function serialize(f: ExplorerFilters & { page: number }): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.q) sp.set('q', f.q);
  for (const k of LIST_KEYS) if (f[k].length) sp.set(k, f[k].join(','));
  if (f.state) sp.set('state', f.state);
  if (f.educationLevel) sp.set('educationLevel', f.educationLevel);
  if (f.hasDeadline) sp.set('hasDeadline', f.hasDeadline);
  if (f.acceptingOnly) sp.set('acceptingOnly', 'true');
  if (f.hideDemo) sp.set('hideDemo', 'true');
  if (f.sort !== 'relevance') sp.set('sort', f.sort);
  if (f.page > 1) sp.set('page', String(f.page));
  return sp;
}

export default function ExplorerPage() {
  const { user } = useAuth();
  const [sp, setSp] = useSearchParams();
  const filters = useMemo(() => parse(sp), [sp]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const meta = useMeta();

  const update = useCallback(
    (patch: Partial<ExplorerFilters & { page: number }>) => {
      setSp(serialize({ ...filters, page: 1, ...patch }), { replace: true });
    },
    [filters, setSp],
  );

  const query = useSchemes({
    q: filters.q || undefined,
    category: filters.category,
    state: filters.state || undefined,
    educationLevel: filters.educationLevel || undefined,
    providerType: filters.providerType,
    benefitType: filters.benefitType,
    eligibility: user ? filters.eligibility : [],
    hasDeadline: filters.hasDeadline || undefined,
    acceptingOnly: filters.acceptingOnly ? 'true' : undefined,
    includeDemo: filters.hideDemo ? 'false' : undefined,
    sort: filters.sort,
    page: filters.page,
    limit: PAGE_SIZE,
  });

  const active = countActive(filters);
  const total = query.data?.meta?.total ?? 0;

  const chips: Array<{ label: string; clear: () => void }> = [];
  if (meta.data) {
    filters.category.forEach((c) => chips.push({ label: labelOf(meta.data.schemeCategories, c), clear: () => update({ category: filters.category.filter((x) => x !== c) }) }));
    filters.eligibility.forEach((c) => chips.push({ label: c.replace(/_/g, ' ').toLowerCase(), clear: () => update({ eligibility: filters.eligibility.filter((x) => x !== c) }) }));
    if (filters.state) chips.push({ label: filters.state, clear: () => update({ state: '' }) });
    if (filters.educationLevel) chips.push({ label: labelOf(meta.data.educationLevels, filters.educationLevel), clear: () => update({ educationLevel: '' }) });
    filters.providerType.forEach((c) => chips.push({ label: labelOf(meta.data.providerTypes, c), clear: () => update({ providerType: filters.providerType.filter((x) => x !== c) }) }));
    filters.benefitType.forEach((c) => chips.push({ label: labelOf(meta.data.benefitTypes, c), clear: () => update({ benefitType: filters.benefitType.filter((x) => x !== c) }) }));
    if (filters.hasDeadline) chips.push({ label: filters.hasDeadline === 'true' ? 'Upcoming deadline' : 'Deadline not verified', clear: () => update({ hasDeadline: '' }) });
    if (filters.acceptingOnly) chips.push({ label: 'Accepting applications', clear: () => update({ acceptingOnly: false }) });
    if (filters.hideDemo) chips.push({ label: 'Demo hidden', clear: () => update({ hideDemo: false }) });
  }

  return (
    <div className="container-page py-8 sm:py-10">
      <PageHeader
        eyebrow="Scheme explorer"
        title="Explore scholarships & welfare schemes"
        description={
          user
            ? 'Each scheme is checked against your profile. Filter by your eligibility to focus on what fits you.'
            : (
              <>
                Browse freely. <Link to="/register" className="link">Create a profile</Link> to see which schemes you are likely eligible for.
              </>
            )
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <SearchBar value={filters.q} onChange={(q) => update({ q })} />
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary min-h-[3rem] lg:hidden" onClick={() => setMobileOpen(true)}>
            <SlidersHorizontal className="h-4 w-4" aria-hidden /> Filters {active > 0 && <span className="chip bg-brand-600 text-white">{active}</span>}
          </button>
          <label htmlFor="sort" className="sr-only">Sort by</label>
          <select id="sort" className="input min-h-[3rem] w-auto" value={filters.sort} onChange={(e) => update({ sort: e.target.value })}>
            <option value="relevance">Most relevant</option>
            <option value="deadline">Deadline approaching</option>
            <option value="verified">Recently verified</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
          {chips.map((c) => (
            <button key={c.label} type="button" onClick={c.clear} className="chip min-h-[2rem] border border-brand-200 bg-brand-50 px-3 capitalize text-brand-800 hover:bg-brand-100">
              {c.label} <X className="h-3.5 w-3.5" aria-hidden /> <span className="sr-only">Remove filter</span>
            </button>
          ))}
          <button type="button" className="text-sm font-semibold text-ink-muted hover:text-ink" onClick={() => setSp(serialize({ ...EMPTY_FILTERS, q: filters.q, page: 1 }))}>
            Clear all
          </button>
        </div>
      )}

      <div className="mt-6 flex gap-8">
        <aside className="hidden w-64 shrink-0 lg:block" aria-label="Filters">
          <div className="card sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto px-5 py-2">
            {meta.data ? <FilterPanel meta={meta.data} filters={filters} onChange={update} personalised={Boolean(user)} /> : <Skeleton className="my-4 h-96" />}
          </div>
        </aside>

        <section className="min-w-0 flex-1" aria-labelledby="results-title">
          <h2 id="results-title" className="sr-only">Results</h2>
          <p className="mb-4 text-sm text-ink-muted" role="status" aria-live="polite">
            {query.isLoading ? 'Loading schemes…' : `${pluralize(total, 'scheme')} found${query.data?.meta?.personalised ? ' · personalised for you' : ''}`}
            {query.isFetching && !query.isLoading && ' · updating…'}
          </p>
          {query.isLoading ? (
            <LoadingSkeleton count={6} label="Loading schemes" />
          ) : query.isError ? (
            <ErrorState error={query.error} onRetry={() => query.refetch()} />
          ) : query.data!.data.length === 0 ? (
            <EmptyState
              icon={<SearchX className="h-7 w-7" aria-hidden />}
              title="No schemes match these filters"
              description="Try removing a filter or using a broader search term."
              action={
                <button type="button" className="btn-secondary" onClick={() => setSp(new URLSearchParams())}>
                  Reset search & filters
                </button>
              }
            />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {query.data!.data.map((s, i) => (
                  <SchemeCard key={s.id} scheme={s} index={i} />
                ))}
              </div>
              <Pagination
                page={filters.page}
                totalPages={query.data!.meta?.totalPages ?? 1}
                onChange={(page) => {
                  setSp(serialize({ ...filters, page }));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </>
          )}
        </section>
      </div>

      <AccessibleModal open={mobileOpen} onClose={() => setMobileOpen(false)} title="Filter schemes" size="lg">
        {meta.data && <FilterPanel meta={meta.data} filters={filters} onChange={update} personalised={Boolean(user)} />}
        <div className="sticky bottom-0 -mx-6 -mb-6 mt-2 flex gap-2 border-t border-line bg-white p-4">
          <button type="button" className="btn-secondary flex-1" onClick={() => setSp(serialize({ ...EMPTY_FILTERS, q: filters.q, page: 1 }))}>
            Clear all
          </button>
          <button type="button" className="btn-primary flex-1" onClick={() => setMobileOpen(false)}>
            Show {pluralize(total, 'result')}
          </button>
        </div>
      </AccessibleModal>
    </div>
  );
}
