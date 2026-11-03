import { Link } from 'react-router-dom';

export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="ss-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#12A0A0" />
          <stop offset="1" stopColor="#075E68" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#ss-g)" />
      <path d="M12 40c6-10 14-15 20-15s14 5 20 15" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <path d="M20 40v-6M32 40v-12M44 40v-6" stroke="#DDF7F3" strokeWidth="4" strokeLinecap="round" />
      <circle cx="32" cy="17" r="4" fill="#fff" />
    </svg>
  );
}

export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 rounded-lg" aria-label="SchemeSetu home">
      <LogoMark />
      <span className="text-lg font-extrabold tracking-tight text-ink">
        Scheme<span className="text-brand-600">Setu</span>
      </span>
    </Link>
  );
}
