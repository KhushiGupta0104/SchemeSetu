import { Link } from 'react-router-dom';
import { Accessibility, ArrowRight, BriefcaseBusiness, Flower2, GraduationCap, HandCoins, HeartHandshake } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const steps = [
  { title: 'Create your profile', text: 'Answer a few optional questions about your state, studies and family income.' },
  { title: 'See matching schemes', text: 'We check each scheme’s conditions and show which ones you meet.' },
  { title: 'Prepare and track', text: 'Save schemes, tick off documents and keep track of your applications.' },
];

const categories = [
  { value: 'education', label: 'Education', Icon: GraduationCap },
  { value: 'financial_assistance', label: 'Financial Assistance', Icon: HandCoins },
  { value: 'women_empowerment', label: 'Women Empowerment', Icon: Flower2 },
  { value: 'disability_support', label: 'Disability Support', Icon: Accessibility },
  { value: 'employment_skills', label: 'Employment & Skills', Icon: BriefcaseBusiness },
  { value: 'social_welfare', label: 'Social Welfare', Icon: HeartHandshake },
];

export default function LandingPage() {
  const { user } = useAuth();
  const findTarget = user ? '/dashboard' : '/register';

  return (
    <>
      {/* Hero */}
      <section className="border-b border-line bg-white">
        <div className="container-page py-14 sm:py-20">
          <h1 className="max-w-2xl text-3xl font-bold sm:text-4xl">Find scholarships and welfare schemes you are eligible for</h1>
          <p className="mt-4 max-w-xl text-ink-muted">
            Fill in a simple profile and SchemeSetu shows which schemes match you, what documents you need and when the
            deadlines are.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to={findTarget} className="btn-primary">
              Find My Schemes <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link to="/schemes" className="btn-secondary">
              Browse All Schemes
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 py-12">
        <div className="container-page">
          <h2 className="text-2xl font-bold">How it works</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="card p-5">
                <p className="text-sm font-semibold text-brand-700">Step {i + 1}</p>
                <h3 className="mt-1 font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Categories */}
      <section className="pb-16">
        <div className="container-page">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-bold">Browse by category</h2>
            <Link to="/schemes" className="link text-sm">
              View all
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
            {categories.map((c) => (
              <Link key={c.value} to={`/schemes?category=${c.value}`} className="card flex items-center gap-3 p-4 font-semibold hover:border-brand-300">
                <c.Icon className="h-5 w-5 shrink-0 text-brand-600" aria-hidden />
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
