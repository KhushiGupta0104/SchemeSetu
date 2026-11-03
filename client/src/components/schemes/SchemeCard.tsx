import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bookmark, BookmarkCheck, Building2, ExternalLink, Gift, MapPin } from 'lucide-react';
import type { SchemeSummary } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useMeta, useToggleSave } from '@/hooks/queries';
import { labelOf } from '@/utils/format';
import { cn } from '@/utils/cn';
import { DeadlineBadge, EligibilityBadge, VerificationBadge } from '@/components/common/Badges';
import { Spinner } from '@/components/common/States';

export function SaveButton({ schemeId, saved, name, variant = 'icon' }: { schemeId: string; saved: boolean; name: string; variant?: 'icon' | 'full' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const mutation = useToggleSave();
  const label = saved ? `Remove ${name} from saved schemes` : `Save ${name}`;

  const onClick = () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    mutation.mutate({ schemeId, saved });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={mutation.isPending}
      aria-pressed={saved}
      aria-label={variant === 'icon' ? label : undefined}
      title={variant === 'icon' ? label : undefined}
      className={cn(
        variant === 'icon' ? 'btn-secondary px-3' : 'btn-secondary',
        saved && 'border-brand-200 bg-brand-50 text-brand-700',
      )}
    >
      {mutation.isPending ? <Spinner /> : saved ? <BookmarkCheck className="h-[1.125rem] w-[1.125rem]" aria-hidden /> : <Bookmark className="h-[1.125rem] w-[1.125rem]" aria-hidden />}
      {variant === 'full' && (saved ? 'Saved' : 'Save Scheme')}
    </button>
  );
}

export function SchemeCard({ scheme, index = 0 }: { scheme: SchemeSummary; index?: number }) {
  const { data: meta } = useMeta();
  const geography = scheme.isAllIndia
    ? 'All India'
    : scheme.applicableStates.length > 2
      ? `${scheme.applicableStates.slice(0, 2).join(', ')} +${scheme.applicableStates.length - 2}`
      : scheme.applicableStates.join(', ');

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.04 }}
      className="card group flex h-full flex-col p-5 transition hover:border-brand-300"
      aria-labelledby={`scheme-${scheme.id}-title`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="chip bg-brand-50 text-brand-700">{labelOf(meta?.schemeCategories, scheme.category)}</span>
        {scheme.eligibility && <EligibilityBadge status={scheme.eligibility.status} />}
        {scheme.isDemo && <VerificationBadge status="demo" />}
      </div>

      <h3 id={`scheme-${scheme.id}-title`} className="mt-3 text-[1.0625rem] font-bold leading-snug">
        <Link to={`/schemes/${scheme.slug}`} className="hover:text-brand-700 focus-visible:underline">
          {scheme.name}
        </Link>
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-ink-muted">{scheme.shortDescription}</p>

      <dl className="mt-4 grid gap-2 text-[0.8125rem] text-ink-soft">
        <div className="flex items-start gap-2">
          <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
          <dt className="sr-only">Provider</dt>
          <dd className="line-clamp-1">
            {scheme.provider} · <span className="text-ink-muted">{labelOf(meta?.providerTypes, scheme.providerType)}</span>
          </dd>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
          <dt className="sr-only">Applies in</dt>
          <dd>{geography}</dd>
        </div>
        <div className="flex items-start gap-2">
          <Gift className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
          <dt className="sr-only">Benefit</dt>
          <dd className="line-clamp-2">{scheme.benefitSummary}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <DeadlineBadge deadline={scheme.deadline} />
      </div>

      <div className="mt-auto flex items-center gap-2 pt-5">
        <Link to={`/schemes/${scheme.slug}`} className="btn-primary flex-1">
          View Details
        </Link>
        <SaveButton schemeId={scheme.id} saved={Boolean(scheme.isSaved)} name={scheme.name} />
        <a
          href={scheme.officialSourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary px-3"
          aria-label={`Official source for ${scheme.name} (opens in a new tab)`}
          title="Official source"
        >
          <ExternalLink className="h-[1.125rem] w-[1.125rem]" aria-hidden />
        </a>
      </div>
    </motion.article>
  );
}
