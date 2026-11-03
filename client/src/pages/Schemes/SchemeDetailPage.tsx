import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CalendarClock,
  ClipboardCheck,
  ExternalLink,
  FileText,
  FlaskConical,
  Gift,
  ListChecks,
  ListOrdered,
  MapPin,
  Scale,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useChecklist, useEligibility, useMeta, useScheme, useTrackApplication } from '@/hooks/queries';
import { ApiError } from '@/services/api';
import { Breadcrumbs } from '@/components/common/Layout';
import { DeadlineBadge, SchemeStatusBadge, VerificationBadge } from '@/components/common/Badges';
import { EmptyState, ErrorState, PageLoader, Skeleton, Spinner } from '@/components/common/States';
import { AccessibleModal } from '@/components/common/Modal';
import { SaveButton } from '@/components/schemes/SchemeCard';
import { EligibilityBreakdown } from '@/components/schemes/EligibilityBreakdown';
import { DocumentChecklist } from '@/components/forms/DocumentChecklist';
import { daysLabel, formatDate, labelOf } from '@/utils/format';

function Section({ id, title, icon, children }: { id: string; title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="card scroll-mt-24 p-5 sm:p-6">
      <h2 id={`${id}-title`} className="mb-4 flex items-center gap-2.5 text-lg font-bold">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-700">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function ChecklistModal({ schemeId, open, onClose }: { schemeId: string; open: boolean; onClose: () => void }) {
  const q = useChecklist(open ? schemeId : undefined);
  return (
    <AccessibleModal open={open} onClose={onClose} title="Document checklist" description="Tick documents as you prepare them. Your progress is saved to your account." size="lg">
      {q.isLoading ? <Skeleton className="h-48" /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : q.data && <DocumentChecklist checklist={q.data} />}
      <Link to={`/checklist?scheme=${schemeId}`} className="link mt-4 inline-block text-sm">Open full checklist page</Link>
    </AccessibleModal>
  );
}

export default function SchemeDetailPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: meta } = useMeta();
  const { data: scheme, isLoading, isError, error, refetch } = useScheme(id);
  const eligibility = useEligibility(scheme?.id, Boolean(user && scheme));
  const track = useTrackApplication();
  const [checklistOpen, setChecklistOpen] = useState(false);

  if (isLoading) return <PageLoader />;
  if (isError || !scheme)
    return (
      <div className="container-page py-12">
        {error instanceof ApiError && error.status === 404 ? (
          <EmptyState
            icon={<AlertTriangle className="h-7 w-7" aria-hidden />}
            title="Scheme not found"
            description="This scheme may have been removed or unpublished, or the link may be incorrect."
            action={<Link to="/schemes" className="btn-primary">Browse schemes</Link>}
          />
        ) : (
          <ErrorState error={error} onRetry={() => refetch()} />
        )}
      </div>
    );

  const requireLogin = (fn: () => void) => () => (user ? fn() : navigate('/login', { state: { from: location.pathname } }));
  const application = scheme.personal?.application;

  return (
    <div className="container-page py-8 sm:py-10">
      <Breadcrumbs items={[{ label: 'Explore Schemes', to: '/schemes' }, { label: scheme.name }]} />

      {scheme.isDemo && (
        <div role="note" className="mb-5 flex gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
          <FlaskConical className="h-5 w-5 shrink-0" aria-hidden />
          <p><strong>Demo record.</strong> This is a hypothetical scheme used to demonstrate SchemeSetu. It is not a real government scheme and cannot be applied for.</p>
        </div>
      )}

      {/* Overview header */}
      <header className="card relative overflow-hidden p-6 sm:p-8">
        <div className="relative">
          <div className="flex flex-wrap gap-2">
            <span className="chip bg-brand-50 text-brand-700">{labelOf(meta?.schemeCategories, scheme.category)}</span>
            <VerificationBadge status={scheme.verificationStatus} verifiedAt={scheme.sourceVerifiedAt} />
            <SchemeStatusBadge status={scheme.windowDisplay} />
            <DeadlineBadge deadline={scheme.deadline} />
          </div>
          <h1 className="mt-4 max-w-4xl text-2xl font-extrabold leading-tight sm:text-3xl text-balance">{scheme.name}</h1>
          <p className="mt-3 max-w-3xl text-ink-muted">{scheme.shortDescription}</p>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
            <div className="flex gap-2"><Building2 className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden /><div><dt className="text-ink-muted">Provider</dt><dd className="font-semibold">{scheme.provider}</dd></div></div>
            <div className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden /><div><dt className="text-ink-muted">Applies in</dt><dd className="font-semibold">{scheme.isAllIndia ? 'All India' : scheme.applicableStates.join(', ')}</dd></div></div>
            <div className="flex gap-2"><Gift className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden /><div><dt className="text-ink-muted">Benefit type</dt><dd className="font-semibold">{labelOf(meta?.benefitTypes, scheme.benefitType)}</dd></div></div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-2">
            {scheme.applicationUrl || scheme.officialSourceUrl ? (
              <a href={scheme.applicationUrl ?? scheme.officialSourceUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
                Open Official Website <ExternalLink className="h-4 w-4" aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : null}
            <SaveButton schemeId={scheme.id} saved={Boolean(scheme.personal?.isSaved)} name={scheme.name} variant="full" />
            {application ? (
              <Link to="/applications" className="btn-secondary border-brand-200 bg-brand-50 text-brand-700">
                <ClipboardCheck className="h-4 w-4" aria-hidden /> Tracking: {labelOf(meta?.applicationStatuses, application.status)}
              </Link>
            ) : (
              <button type="button" className="btn-secondary" disabled={track.isPending} onClick={requireLogin(() => track.mutate(scheme.id))}>
                {track.isPending ? <Spinner /> : <ClipboardCheck className="h-4 w-4" aria-hidden />} Track Application
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={requireLogin(() => setChecklistOpen(true))}>
              <ListChecks className="h-4 w-4" aria-hidden /> View Document Checklist
            </button>
          </div>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-6">
          <Section id="overview" title="Scheme overview" icon={<FileText className="h-4 w-4" aria-hidden />}>
            <p className="whitespace-pre-line leading-relaxed text-ink-soft">{scheme.description}</p>
          </Section>

          <Section id="benefits" title="Benefits" icon={<Gift className="h-4 w-4" aria-hidden />}>
            <p className="font-semibold">{scheme.benefitSummary}</p>
            {scheme.benefits.length > 0 && (
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-ink-soft">
                {scheme.benefits.map((b) => <li key={b}>{b}</li>)}
              </ul>
            )}
          </Section>

          <Section id="eligibility" title="Your eligibility" icon={<Scale className="h-4 w-4" aria-hidden />}>
            {!user ? (
              <div className="rounded-xl bg-slate-50 p-4 text-sm">
                <p className="text-ink-soft">Log in and complete your profile to see a criterion-by-criterion eligibility check for this scheme.</p>
                <Link to="/login" state={{ from: location.pathname }} className="btn-primary btn-sm mt-3">Log in to check eligibility</Link>
              </div>
            ) : eligibility.isLoading ? (
              <Skeleton className="h-40" />
            ) : eligibility.isError ? (
              <ErrorState error={eligibility.error} onRetry={() => eligibility.refetch()} />
            ) : eligibility.data ? (
              <EligibilityBreakdown result={eligibility.data} />
            ) : null}
          </Section>

          <Section id="criteria" title="Eligibility criteria (as recorded)" icon={<ListOrdered className="h-4 w-4" aria-hidden />}>
            <p className="text-sm text-ink-muted">These are the conditions SchemeSetu checks automatically, plus any conditions you must verify yourself.</p>
            {scheme.additionalCriteria.length > 0 && (
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink-soft">
                {scheme.additionalCriteria.map((c) => <li key={c}>{c}</li>)}
              </ul>
            )}
            {!user && <p className="mt-3 text-sm text-ink-muted">Log in to see each automatically checked condition evaluated against your profile.</p>}
          </Section>

          <Section id="documents" title="Required documents" icon={<ListChecks className="h-4 w-4" aria-hidden />}>
            {scheme.requiredDocuments.length ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {scheme.requiredDocuments.map((d) => (
                  <li key={d.docId} className="rounded-xl border border-line p-3 text-sm">
                    <p className="font-semibold">{d.name} {d.optional && <span className="chip ml-1 bg-slate-100 text-ink-muted">If applicable</span>}</p>
                    {d.description && <p className="mt-0.5 text-ink-muted">{d.description}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">No document list is recorded. Check the official source.</p>
            )}
            <button type="button" className="btn-secondary btn-sm mt-4" onClick={requireLogin(() => setChecklistOpen(true))}>
              <ListChecks className="h-4 w-4" aria-hidden /> Track documents I&apos;ve prepared
            </button>
          </Section>

          <Section id="apply" title="Application procedure" icon={<ClipboardCheck className="h-4 w-4" aria-hidden />}>
            {scheme.applicationSteps.length ? (
              <ol className="space-y-3">
                {scheme.applicationSteps.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">{i + 1}</span>
                    <p className="pt-0.5 text-ink-soft">{s}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-ink-muted">Application steps are not recorded. Check the official source.</p>
            )}
            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-ink-muted">SchemeSetu does not submit applications. Apply only through the official portal.</p>
          </Section>
        </div>

        <aside className="space-y-6">
          <div className="card p-5 lg:sticky lg:top-24">
            <h2 className="flex items-center gap-2 font-bold"><CalendarClock className="h-5 w-5 text-brand-600" aria-hidden /> Important dates</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-ink-muted">Opens</dt><dd className="font-semibold">{formatDate(scheme.applicationOpenDate)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink-muted">Deadline</dt><dd className="font-semibold">{formatDate(scheme.applicationDeadline)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink-muted">Status</dt><dd className="text-right font-semibold">{daysLabel(scheme.deadline.daysRemaining)}</dd></div>
            </dl>
            {!scheme.applicationDeadline && <p className="mt-3 text-xs text-ink-muted">No verified deadline is on record. Application windows change every year — check the official source.</p>}

            <h2 className="mt-6 flex items-center gap-2 font-bold"><BadgeCheck className="h-5 w-5 text-brand-600" aria-hidden /> Source &amp; verification</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div><dt className="text-ink-muted">Official source</dt><dd><a href={scheme.officialSourceUrl} target="_blank" rel="noopener noreferrer" className="link break-all">{scheme.officialSourceUrl}</a></dd></div>
              {scheme.applicationUrl && <div><dt className="text-ink-muted">Application link</dt><dd><a href={scheme.applicationUrl} target="_blank" rel="noopener noreferrer" className="link break-all">{scheme.applicationUrl}</a></dd></div>}
              <div className="flex justify-between gap-3"><dt className="text-ink-muted">Last verified</dt><dd className="font-semibold">{scheme.sourceVerifiedAt ? formatDate(scheme.sourceVerifiedAt) : 'Not yet verified'}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink-muted">Record updated</dt><dd className="font-semibold">{formatDate(scheme.updatedAt)}</dd></div>
            </dl>
            {scheme.verificationNotes && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-ink-muted">{scheme.verificationNotes}</p>}
          </div>
        </aside>
      </div>

      {user && <ChecklistModal schemeId={scheme.id} open={checklistOpen} onClose={() => setChecklistOpen(false)} />}
    </div>
  );
}
