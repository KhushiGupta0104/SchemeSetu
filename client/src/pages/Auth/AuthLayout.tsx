import type { ReactNode } from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { LogoMark } from '@/components/layout/Logo';

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: ReactNode; children: ReactNode }) {
  return (
    <div className="container-page py-10 sm:py-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-line bg-white shadow-lift lg:grid-cols-2">
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-brand-700 via-brand-800 to-indigo-900 p-10 text-white lg:flex">
          <div className="absolute inset-0 bg-grid opacity-20" aria-hidden />
          <div className="relative">
            <LogoMark className="h-12 w-12" />
            <p className="mt-6 text-2xl font-extrabold leading-snug text-white">Bridging you to the benefits you deserve.</p>
          </div>
          <ul className="relative space-y-3 text-sm text-brand-100">
            {['Personalised, explainable scheme matches', 'Deadlines, checklists and progress in one place', 'We never ask for Aadhaar or bank details'].map((t) => (
              <li key={t} className="flex gap-2">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-300" aria-hidden /> {t}
              </li>
            ))}
            <li className="flex gap-2 pt-3 text-xs text-brand-200">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden /> Passwords are hashed; sessions use secure HttpOnly cookies.
            </li>
          </ul>
        </div>
        <div className="p-6 sm:p-10">
          <h1 className="text-2xl font-extrabold">{title}</h1>
          <p className="mt-1.5 text-sm text-ink-muted">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </div>
      </div>
    </div>
  );
}
