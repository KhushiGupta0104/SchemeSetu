import { Link } from 'react-router-dom';

const links = [
  { to: '/about', label: 'About' },
  { to: '/disclaimer', label: 'Disclaimer' },
  { to: '/privacy', label: 'Privacy' },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-white">
      <div className="container-page flex flex-col gap-2 py-5 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} SchemeSetu · College project. Not an official government website.</p>
        <nav aria-label="Footer" className="flex gap-4">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-brand-700">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
