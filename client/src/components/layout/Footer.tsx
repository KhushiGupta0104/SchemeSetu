import { Link } from 'react-router-dom';
import { Logo } from './Logo';

const columns = [
  {
    title: 'Platform',
    links: [
      { to: '/schemes', label: 'Explore Schemes' },
      { to: '/deadlines', label: 'Deadline Tracker' },
      { to: '/#how-it-works', label: 'How It Works' },
      { to: '/register', label: 'Create Profile' },
    ],
  },
  {
    title: 'About',
    links: [
      { to: '/about', label: 'About SchemeSetu' },
      { to: '/contact', label: 'Contact' },
      { to: '/disclaimer', label: 'Disclaimer' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { to: '/privacy', label: 'Privacy Policy' },
      { to: '/terms', label: 'Terms of Use' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-white">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-ink-muted">
            Bridging you to the benefits you deserve. An independent discovery tool — not an official government portal.
            Always confirm details on the official source before applying.
          </p>
        </div>
        {columns.map((c) => (
          <div key={c.title}>
            <h2 className="text-sm font-bold text-ink">{c.title}</h2>
            <ul className="mt-3 space-y-2">
              {c.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-ink-muted hover:text-brand-700">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-ink-muted sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} SchemeSetu — a Web Technology course project.</p>
          <p>Eligibility results are preliminary and do not guarantee approval.</p>
        </div>
      </div>
    </footer>
  );
}
