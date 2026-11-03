import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminApi } from '@/services/endpoints';
import { errorMessage } from '@/services/api';
import { useMeta } from '@/hooks/queries';
import { PageHeader, Pagination } from '@/components/common/Layout';
import { EmptyState, ErrorState, Skeleton } from '@/components/common/States';
import { ConfirmationDialog } from '@/components/common/Modal';
import { VerificationBadge } from '@/components/common/Badges';
import { SearchBar } from '@/components/schemes/FilterPanel';
import type { AdminSchemeRow } from '@/types';
import { daysLabel, formatDate, labelOf } from '@/utils/format';

export default function AdminSchemesPage() {
  const [sp, setSp] = useSearchParams();
  const { data: meta } = useMeta();
  const qc = useQueryClient();
  const [toDelete, setToDelete] = useState<AdminSchemeRow | null>(null);
  const query = {
    q: sp.get('q') ?? undefined,
    publicationStatus: sp.get('publicationStatus') ?? undefined,
    verificationStatus: sp.get('verificationStatus') ?? undefined,
    category: sp.get('category') ?? undefined,
    sort: sp.get('sort') ?? 'updated',
    page: Number(sp.get('page')) || 1,
    limit: 20,
  };
  const set = (k: string, v: string) => {
    const next = new URLSearchParams(sp);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== 'page') next.delete('page');
    setSp(next, { replace: true });
  };

  const list = useQuery({ queryKey: ['admin', 'schemes', query], queryFn: () => AdminApi.list(query), placeholderData: keepPreviousData });

  const invalidate = () => Promise.all([qc.invalidateQueries({ queryKey: ['admin'] }), qc.invalidateQueries({ queryKey: ['schemes'] }), qc.invalidateQueries({ queryKey: ['scheme'] })]);

  const togglePublish = useMutation({
    mutationFn: (s: AdminSchemeRow) => AdminApi.update(s.id, { publicationStatus: s.publicationStatus === 'published' ? 'draft' : 'published' }),
    onSuccess: (d) => {
      toast.success(d.publicationStatus === 'published' ? 'Scheme published — now visible to users' : 'Scheme unpublished — hidden from users');
      void invalidate();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => AdminApi.remove(id),
    onSuccess: (d) => {
      toast.success(`Scheme deleted. ${d.removedBookmarks} bookmark(s) removed; ${d.retainedApplications} user application record(s) kept.`);
      setToDelete(null);
      void invalidate();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <>
      <PageHeader eyebrow="Administration" title="Manage schemes" actions={<Link to="/admin/schemes/new" className="btn-primary"><Plus className="h-4 w-4" aria-hidden /> Add scheme</Link>} />
      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto_auto]">
        <SearchBar value={query.q ?? ''} onChange={(v) => set('q', v)} placeholder="Search name, provider or slug" />
        {[
          { k: 'publicationStatus', label: 'Publication', opts: meta?.publicationStatuses ?? [] },
          { k: 'verificationStatus', label: 'Verification', opts: meta?.verificationStatuses ?? [] },
          { k: 'category', label: 'Category', opts: meta?.schemeCategories ?? [] },
        ].map((f) => (
          <div key={f.k}>
            <label htmlFor={`af-${f.k}`} className="sr-only">{f.label}</label>
            <select id={`af-${f.k}`} className="input min-h-[3rem]" value={sp.get(f.k) ?? ''} onChange={(e) => set(f.k, e.target.value)}>
              <option value="">All {f.label.toLowerCase()}</option>
              {f.opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        ))}
        <div>
          <label htmlFor="af-sort" className="sr-only">Sort</label>
          <select id="af-sort" className="input min-h-[3rem]" value={query.sort} onChange={(e) => set('sort', e.target.value)}>
            <option value="updated">Recently updated</option>
            <option value="name">Name</option>
            <option value="deadline">Deadline</option>
          </select>
        </div>
      </div>

      {list.isLoading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : !list.data!.data.length ? (
        <EmptyState title="No schemes found" description="Adjust the filters or add a new scheme." action={<Link to="/admin/schemes/new" className="btn-primary">Add scheme</Link>} />
      ) : (
        <>
          <p className="mb-2 text-sm text-ink-muted" role="status">{list.data!.meta?.total} schemes</p>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <caption className="sr-only">Schemes</caption>
              <thead className="border-b border-line bg-slate-50 text-xs uppercase tracking-wide text-ink-muted">
                <tr>
                  <th scope="col" className="px-4 py-3">Scheme</th>
                  <th scope="col" className="px-4 py-3">Category</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Verification</th>
                  <th scope="col" className="px-4 py-3">Deadline</th>
                  <th scope="col" className="px-4 py-3">Updated</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.data!.data.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <th scope="row" className="max-w-xs px-4 py-3 font-semibold">
                      <Link to={`/admin/schemes/${s.id}/edit`} className="line-clamp-2 hover:text-brand-700">{s.name}</Link>
                      <span className="block text-xs font-normal text-ink-muted">{s.provider}</span>
                    </th>
                    <td className="px-4 py-3">{labelOf(meta?.schemeCategories, s.category)}</td>
                    <td className="px-4 py-3">
                      <span className={`chip ${s.publicationStatus === 'published' ? 'bg-success-soft text-success' : 'bg-slate-100 text-ink-muted'}`}>{s.publicationStatus === 'published' ? 'Published' : 'Draft'}</span>
                    </td>
                    <td className="px-4 py-3"><VerificationBadge status={s.verificationStatus} verifiedAt={s.sourceVerifiedAt} /></td>
                    <td className="px-4 py-3 text-ink-soft">{s.applicationDeadline ? <>{formatDate(s.applicationDeadline)}<span className="block text-xs text-ink-muted">{daysLabel(s.deadline.daysRemaining)}</span></> : <span className="text-ink-muted">Not set</span>}</td>
                    <td className="px-4 py-3 text-ink-muted">{formatDate(s.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button type="button" className="btn-secondary btn-sm px-2.5" disabled={togglePublish.isPending} onClick={() => togglePublish.mutate(s)} aria-label={`${s.publicationStatus === 'published' ? 'Unpublish' : 'Publish'} ${s.name}`} title={s.publicationStatus === 'published' ? 'Unpublish' : 'Publish'}>
                          {s.publicationStatus === 'published' ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                        </button>
                        <Link to={`/admin/schemes/${s.id}/edit`} className="btn-secondary btn-sm px-2.5" aria-label={`Edit ${s.name}`} title="Edit"><Pencil className="h-4 w-4" aria-hidden /></Link>
                        <button type="button" className="btn-secondary btn-sm px-2.5 text-danger" onClick={() => setToDelete(s)} aria-label={`Delete ${s.name}`} title="Delete"><Trash2 className="h-4 w-4" aria-hidden /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={query.page} totalPages={list.data!.meta?.totalPages ?? 1} onChange={(p) => set('page', String(p))} />
        </>
      )}

      <ConfirmationDialog
        open={Boolean(toDelete)}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        loading={remove.isPending}
        title="Delete this scheme permanently?"
        description={`“${toDelete?.name ?? ''}” will be removed. Users' bookmarks and checklists for it are deleted; their application records are kept and marked as no longer available. Consider unpublishing instead.`}
        confirmLabel="Delete scheme"
      />
    </>
  );
}
