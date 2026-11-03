import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-16">
      <div className="text-center">
        <p className="text-6xl font-extrabold text-brand-200">404</p>
        <h1 className="mt-3 text-2xl font-extrabold">Page not found</h1>
        <p className="mt-2 text-ink-muted">The page you were looking for doesn&apos;t exist or has moved.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to="/" className="btn-secondary">Go home</Link>
          <Link to="/schemes" className="btn-primary"><Compass className="h-4 w-4" aria-hidden /> Explore schemes</Link>
        </div>
      </div>
    </div>
  );
}
