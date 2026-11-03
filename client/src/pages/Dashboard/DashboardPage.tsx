import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bookmark,
  CalendarClock,
  CheckCircle2,
  CircleHelp,
  ClipboardCheck,
  Compass,
  ListChecks,
  Sparkles,
  UserRoundPen,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDashboard, useMeta } from '@/hooks/queries';
import { PageHeader, SectionHeader, StatCard } from '@/components/common/Layout';
import { EmptyState, ErrorState, LoadingSkeleton, Skeleton } from '@/components/common/States';
import { DeadlineBadge, EligibilityBadge } from '@/components/common/Badges';
import { SchemeCard } from '@/components/schemes/SchemeCard';
import { ProfileCompletionIndicator } from '@/components/dashboard/Widgets';
import { formatDate, labelOf, timeAgo } from '@/utils/format';

const CategoryBarChart = lazy(() => import('@/components/dashboard/CategoryBarChart').then((m) => ({ default: m.CategoryBarChart })));

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useDashboard();
  const { data: meta } = useMeta();
  const firstName = user?.name.split(' ')[0];

  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />;

  const savedIds = new Set(data?.savedIds ?? []);
  const trackedStatuses = data?.applicationStatusCounts.filter((s) => s.count > 0) ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back, ${firstName}!`}
        description="Here are the opportunities matching your profile."
        actions={
          <Link to="/schemes" className="btn-primary">
            <Compass className="h-4 w-4" aria-hidden /> Explore Schemes
          </Link>
        }
      />

      {user && !user.onboardingCompleted && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col gap-3 rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 to-indigo-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <Sparkles className="h-6 w-6 shrink-0 text-brand-600" aria-hidden />
            <div>
              <p className="font-bold">Complete your profile to get personalised matches</p>
              <p className="text-sm text-ink-muted">It takes about three minutes and every question is optional.</p>
            </div>
          </div>
          <Link to="/onboarding" className="btn-primary shrink-0">
            Start profile <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </motion.div>
      )}

      <section aria-label="Summary" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {isLoading || !data ? (
          Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-[5.25rem] rounded-2xl" />)
        ) : (
          <>
            <StatCard label="Likely eligible" value={data.counts.likelyEligible} icon={<CheckCircle2 className="h-5 w-5" aria-hidden />} tone="success" to="/schemes?eligibility=LIKELY_ELIGIBLE" />
            <StatCard label="Need more info" value={data.counts.moreInformationNeeded} icon={<CircleHelp className="h-5 w-5" aria-hidden />} tone="warning" to="/schemes?eligibility=MORE_INFORMATION_NEEDED" />
            <StatCard label="Saved schemes" value={data.counts.saved} icon={<Bookmark className="h-5 w-5" aria-hidden />} to="/saved" />
            <StatCard label="Deadlines in 30 days" value={data.counts.upcomingDeadlines} icon={<CalendarClock className="h-5 w-5" aria-hidden />} tone="indigo" to="/deadlines" />
            <StatCard label="Applications tracked" value={data.counts.applications} icon={<ClipboardCheck className="h-5 w-5" aria-hidden />} tone="slate" to="/applications" />
          </>
        )}
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="rec-title">
            <SectionHeader
              id="rec-title"
              title="Recommended for you"
              description={data ? `Checked against ${data.counts.totalSchemes} published schemes using your profile.` : undefined}
              action={
                <Link to="/schemes" className="link inline-flex items-center gap-1 text-sm">
                  See all <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              }
            />
            {isLoading || !data ? (
              <LoadingSkeleton count={4} label="Loading recommendations" />
            ) : data.recommended.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {data.recommended.map((s, i) => (
                  <SchemeCard key={s.id} scheme={{ ...s, isSaved: savedIds.has(s.id) }} index={i} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No matches yet"
                description="Add more details to your profile, or browse all schemes — eligibility is checked for every scheme you open."
                action={
                  <>
                    <Link to="/profile" className="btn-primary">Update profile</Link>
                    <Link to="/schemes" className="btn-secondary">Browse schemes</Link>
                  </>
                }
              />
            )}
          </section>

          <section aria-labelledby="dl-title">
            <SectionHeader id="dl-title" title="Upcoming deadlines" description="Verified deadlines in the next 30 days for schemes relevant to you." action={<Link to="/deadlines" className="link text-sm">Deadline tracker</Link>} />
            {isLoading || !data ? (
              <Skeleton className="h-32 rounded-2xl" />
            ) : data.upcomingDeadlines.length ? (
              <ul className="card divide-y divide-line">
                {data.upcomingDeadlines.map((s) => (
                  <li key={s.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <Link to={`/schemes/${s.slug}`} className="font-semibold hover:text-brand-700">
                        {s.name}
                      </Link>
                      <p className="text-sm text-ink-muted">Closes {formatDate(s.applicationDeadline)}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {s.eligibility && <EligibilityBadge status={s.eligibility.status} />}
                      <DeadlineBadge deadline={s.deadline} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={<CalendarClock className="h-7 w-7" aria-hidden />} title="No verified deadlines in the next 30 days" description="Many schemes don't have a verified deadline yet. Check the official source for current application windows." />
            )}
          </section>
        </div>

        <aside className="space-y-6" aria-label="Your progress">
          {data ? <ProfileCompletionIndicator completion={data.profileCompletion} /> : <Skeleton className="h-48 rounded-2xl" />}

          <section className="card p-5" aria-labelledby="qa-title">
            <h2 id="qa-title" className="font-bold">Quick actions</h2>
            <div className="mt-3 grid gap-2">
              {[
                { to: '/schemes', label: 'Explore Schemes', Icon: Compass },
                { to: '/profile', label: 'Edit Profile', Icon: UserRoundPen },
                { to: '/saved', label: 'View Saved Schemes', Icon: Bookmark },
                { to: '/applications', label: 'Track Applications', Icon: ClipboardCheck },
                { to: '/checklist', label: 'Document Checklist', Icon: ListChecks },
              ].map((a) => (
                <Link key={a.to} to={a.to} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-sm font-semibold transition hover:border-brand-300 hover:bg-brand-50">
                  <a.Icon className="h-4 w-4 text-brand-600" aria-hidden /> {a.label}
                  <ArrowRight className="ml-auto h-4 w-4 text-ink-muted" aria-hidden />
                </Link>
              ))}
            </div>
          </section>

          {trackedStatuses.length > 0 && (
            <section className="card p-5" aria-labelledby="apps-chart-title">
              <h2 id="apps-chart-title" className="font-bold">Applications by status</h2>
              <p className="mb-3 text-xs text-ink-muted">Statuses you have recorded.</p>
              <Suspense fallback={<Skeleton className="h-40" />}>
                <CategoryBarChart data={trackedStatuses.map((s) => ({ label: s.label, count: s.count }))} title="Tracked applications by status" unit="applications" />
              </Suspense>
            </section>
          )}

          <section className="card p-5" aria-labelledby="activity-title">
            <h2 id="activity-title" className="font-bold">Recent activity</h2>
            {data?.recentActivity.length ? (
              <ol className="mt-3 space-y-3">
                {data.recentActivity.map((a, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${a.type === 'saved' ? 'bg-brand-50 text-brand-700' : 'bg-indigo-50 text-indigo-700'}`}>
                      {a.type === 'saved' ? <Bookmark className="h-3.5 w-3.5" aria-hidden /> : <ClipboardCheck className="h-3.5 w-3.5" aria-hidden />}
                    </span>
                    <div className="min-w-0">
                      <p className="line-clamp-2">
                        {a.type === 'saved' ? 'Saved ' : `Marked “${labelOf(meta?.applicationStatuses, a.status)}” — `}
                        <Link to={`/schemes/${a.schemeId}`} className="font-semibold hover:text-brand-700">{a.schemeName}</Link>
                      </p>
                      <p className="text-xs text-ink-muted">{timeAgo(a.at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-sm text-ink-muted">Saved schemes and application updates will appear here.</p>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
