import { Link } from 'react-router-dom';

export function LogoMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <span className={`grid place-items-center rounded-md bg-brand-600 text-sm font-bold text-white ${className}`} aria-hidden>
      S
    </span>
  );
}

export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 rounded-md" aria-label="SchemeSetu home">
      <LogoMark />
      <span className="text-lg font-bold text-ink">SchemeSetu</span>
    </Link>
  );
}
