import { Component, useEffect, type ErrorInfo, type ReactNode } from 'react';
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/cn';
import { PageLoader } from '@/components/common/States';
import { Navbar } from './Navbar';
import { ADMIN_NAV, APP_NAV, type NavItem } from './nav';

/** Scrolls to top on navigation, or to the #hash target when present. */
export function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 60);
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollManager />
      <Navbar />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}

export function Sidebar({ items, title }: { items: NavItem[]; title: string }) {
  return (
    <aside className="hidden w-60 shrink-0 lg:block" aria-label={title}>
      <nav className="sticky top-24 space-y-1">
        <p className="mb-2 px-3 text-xs font-bold uppercase tracking-[0.14em] text-ink-muted">{title}</p>
        {items.map((i) => (
          <NavLink
            key={i.to}
            to={i.to}
            end={i.to === '/admin'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                isActive ? 'bg-white text-brand-700 shadow-card ring-1 ring-line' : 'text-ink-soft hover:bg-white/70 hover:text-ink',
              )
            }
          >
            <i.icon className="h-[1.125rem] w-[1.125rem]" aria-hidden />
            {i.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

/** Personal area: sidebar on desktop when signed in. */
export function AppShell() {
  const { user } = useAuth();
  return (
    <div className="container-page flex gap-8 py-6 sm:py-8">
      {user && <Sidebar items={APP_NAV} title="My SchemeSetu" />}
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}

export function AdminShell() {
  return (
    <div className="container-page flex gap-8 py-6 sm:py-8">
      <Sidebar items={ADMIN_NAV} title="Administration" />
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex gap-2 lg:hidden">
          {ADMIN_NAV.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.to === '/admin'} className={({ isActive }) => cn('chip py-1.5', isActive ? 'bg-brand-600 text-white' : 'bg-white ring-1 ring-line')}>
              {i.label}
            </NavLink>
          ))}
        </div>
        <Outlet />
      </div>
    </div>
  );
}

/** Client-side guard for UX only — the API enforces authentication on every request. */
export function ProtectedRoute({ children }: { children?: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children ? <>{children}</> : <Outlet />;
}

/** UX guard for admin pages. Real authorisation is enforced server-side (403 for non-admins). */
export function AdminRoute({ children }: { children?: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.role !== 'admin')
    return (
      <div className="container-page py-16">
        <div className="card mx-auto max-w-lg p-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-warning" aria-hidden />
          <h1 className="mt-3 text-xl font-bold">Administrators only</h1>
          <p className="mt-2 text-sm text-ink-muted">Your account does not have access to the admin panel.</p>
        </div>
      </div>
    );
  return children ? <>{children}</> : <Outlet />;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
     
    console.error('UI error', error, info.componentStack);
  }
  render() {
    if (this.state.error)
      return (
        <div className="container-page py-16">
          <div role="alert" className="card mx-auto max-w-lg p-8 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-danger" aria-hidden />
            <h1 className="mt-3 text-xl font-bold">Something went wrong on this page</h1>
            <p className="mt-2 text-sm text-ink-muted">Please reload the page. If the problem continues, try again later.</p>
            <button type="button" className="btn-primary mt-5" onClick={() => window.location.reload()}>
              Reload page
            </button>
          </div>
        </div>
      );
    return this.props.children;
  }
}
