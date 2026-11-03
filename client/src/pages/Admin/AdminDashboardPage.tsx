import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, FilePen, FileStack, FlaskConical, Globe, Plus, ShieldAlert, Users } from 'lucide-react';
import { AdminApi } from '@/services/endpoints';
import { PageHeader, StatCard } from '@/components/common/Layout';
import { ErrorState, Skeleton } from '@/components/common/States';
import { VerificationBadge } from '@/components/common/Badges';
import { timeAgo } from '@/utils/format';

const CategoryBarChart = lazy(() => import('@/components/dashboard/CategoryBarChart').then((m) => ({ default: m.CategoryBarChart })));

export default function AdminDashboardPage() {
  const q = useQuery({ queryKey: ['admin', 'stats'], queryFn: AdminApi.stats });

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Admin overview"
        description="Aggregate scheme information only — individual user profiles are never shown here."
        actions={<Link to="/admin/schemes/new" className="btn-primary"><Plus className="h-4 w-4" aria-hidden /> Add scheme</Link>}
      />
      {q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {!q.data ? (
              Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[5.25rem] rounded-2xl" />)
            ) : (
              <>
                <StatCard label="Total schemes" value={q.data.totals.total} icon={<FileStack className="h-5 w-5" aria-hidden />} to="/admin/schemes" />
                <StatCard label="Published" value={q.data.totals.published} icon={<Globe className="h-5 w-5" aria-hidden />} tone="success" to="/admin/schemes?publicationStatus=published" />
                <StatCard label="Drafts" value={q.data.totals.draft} icon={<FilePen className="h-5 w-5" aria-hidden />} tone="slate" to="/admin/schemes?publicationStatus=draft" />
                <StatCard label="Deadlines in 30 days" value={q.data.totals.upcomingDeadlines} icon={<CalendarClock className="h-5 w-5" aria-hidden />} tone="indigo" to="/admin/schemes?sort=deadline" />
                <StatCard label="Need verification" value={q.data.totals.needsVerification} icon={<ShieldAlert className="h-5 w-5" aria-hidden />} tone="warning" hint={`Unverified or >${q.data.staleVerificationDays} days old`} to="/admin/schemes?verificationStatus=needs_review" />
                <StatCard label="Registered users" value={q.data.totals.registeredUsers} icon={<Users className="h-5 w-5" aria-hidden />} tone="brand" />
              </>
            )}
          </div>
          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <section className="card p-5" aria-labelledby="cat-title">
              <h2 id="cat-title" className="font-bold">Schemes by category</h2>
              <p className="mb-3 text-xs text-ink-muted">All schemes, including drafts{q.data?.totals.demo ? ` and ${q.data.totals.demo} demo records` : ''}.</p>
              {q.data ? (
                <Suspense fallback={<Skeleton className="h-52" />}>
                  <CategoryBarChart data={q.data.byCategory.map((c) => ({ label: c.label, count: c.count }))} title="Schemes by category" unit="schemes" />
                </Suspense>
              ) : <Skeleton className="h-52" />}
            </section>
            <section className="card p-5" aria-labelledby="recent-title">
              <h2 id="recent-title" className="mb-3 font-bold">Recently updated</h2>
              {q.data ? (
                <ul className="divide-y divide-line">
                  {q.data.recentlyUpdated.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <Link to={`/admin/schemes/${s.id}/edit`} className="line-clamp-1 text-sm font-semibold hover:text-brand-700">{s.name}</Link>
                        <p className="text-xs text-ink-muted">{s.publicationStatus === 'published' ? 'Published' : 'Draft'} · {timeAgo(s.updatedAt)}</p>
                      </div>
                      {s.isDemo ? <span className="chip bg-indigo-50 text-indigo-700"><FlaskConical className="h-3.5 w-3.5" aria-hidden /> Demo</span> : <VerificationBadge status={s.verificationStatus} />}
                    </li>
                  ))}
                </ul>
              ) : <Skeleton className="h-52" />}
            </section>
          </div>
        </>
      )}
    </>
  );
}
