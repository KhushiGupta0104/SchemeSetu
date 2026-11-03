import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, LogOut, Menu, ShieldCheck, UserRound, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/cn';
import { Logo } from './Logo';
import { APP_NAV, PUBLIC_NAV } from './nav';

const linkCls = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-lg px-3 py-2 text-sm font-semibold transition',
    isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-slate-100 hover:text-ink',
  );

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  if (!user) return null;
  const initials = user.name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const doLogout = async () => {
    setOpen(false);
    navigate('/');
    await logout();
    toast.success('You have been logged out');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-xl border border-line bg-white py-1.5 pl-1.5 pr-2.5 text-sm font-semibold hover:border-brand-300"
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-xs font-bold text-white">
          {initials}
        </span>
        <span className="hidden max-w-[8rem] truncate lg:inline">{user.name.split(' ')[0]}</span>
        <ChevronDown className="h-4 w-4 text-ink-muted" aria-hidden />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-60 rounded-2xl border border-line bg-white p-2 shadow-lift"
          >
            <div className="border-b border-line px-3 pb-2.5 pt-1.5">
              <p className="truncate text-sm font-bold">{user.name}</p>
              <p className="truncate text-xs text-ink-muted">{user.email}</p>
            </div>
            <Link role="menuitem" to="/profile" onClick={() => setOpen(false)} className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50">
              <UserRound className="h-4 w-4" aria-hidden /> My profile
            </Link>
            {user.role === 'admin' && (
              <Link role="menuitem" to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50">
                <ShieldCheck className="h-4 w-4" aria-hidden /> Admin panel
              </Link>
            )}
            <button role="menuitem" type="button" onClick={doLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-soft">
              <LogOut className="h-4 w-4" aria-hidden /> Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setMobileOpen(false), [location.pathname, location.hash]);

  const items = user ? APP_NAV.slice(0, 4) : PUBLIC_NAV;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow">
        Skip to main content
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo to={user ? '/dashboard' : '/'} />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.to === '/'} className={i.to.includes('#') ? () => linkCls({ isActive: false }) : linkCls}>
              {i.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <UserMenu />
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className="btn-ghost">
                Log in
              </Link>
              <Link to="/register" className="btn-primary">
                Get Started
              </Link>
            </div>
          )}
          <button
            type="button"
            className="btn-ghost px-2.5 md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            id="mobile-nav"
            aria-label="Mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-line bg-white md:hidden"
          >
            <div className="container-page grid gap-1 py-3">
              {(user ? APP_NAV : PUBLIC_NAV.map((p) => ({ ...p, icon: null }))).map((i) => (
                <NavLink
                  key={i.to}
                  to={i.to}
                  end={i.to === '/'}
                  className={({ isActive }) =>
                    cn('flex min-h-[3rem] items-center gap-3 rounded-xl px-3 text-[0.9375rem] font-semibold', isActive && !i.to.includes('#') ? 'bg-brand-50 text-brand-700' : 'text-ink-soft')
                  }
                >
                  {i.icon && <i.icon className="h-5 w-5" aria-hidden />}
                  {i.label}
                </NavLink>
              ))}
              {user?.role === 'admin' && (
                <NavLink to="/admin" className="flex min-h-[3rem] items-center gap-3 rounded-xl px-3 font-semibold text-ink-soft">
                  <ShieldCheck className="h-5 w-5" aria-hidden /> Admin panel
                </NavLink>
              )}
              <div className="mt-2 grid gap-2 border-t border-line pt-3">
                {user ? (
                  <button
                    type="button"
                    className="btn-secondary w-full text-danger"
                    onClick={async () => {
                      navigate('/');
                      await logout();
                      toast.success('You have been logged out');
                    }}
                  >
                    <LogOut className="h-4 w-4" aria-hidden /> Log out
                  </button>
                ) : (
                  <>
                    <Link to="/login" className="btn-secondary w-full">
                      Log in
                    </Link>
                    <Link to="/register" className="btn-primary w-full">
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
