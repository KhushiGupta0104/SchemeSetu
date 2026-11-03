import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Accessibility,
  ArrowRight,
  BellRing,
  Bot,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CircleHelp,
  ClipboardCheck,
  ExternalLink,
  GraduationCap,
  HandCoins,
  HeartHandshake,
  ListChecks,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  UserRoundPlus,
  Users,
  Flower2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.45 },
};

function HeroPreview() {
  const rows = [
    { name: 'Merit scholarship for undergraduates', tag: 'Education', status: 'Likely Eligible', tone: 'bg-success-soft text-success', Icon: CheckCircle2 },
    { name: 'Technical education scholarship for girls', tag: 'Women', status: 'Likely Eligible', tone: 'bg-success-soft text-success', Icon: CheckCircle2 },
    { name: 'Post-matric scholarship', tag: 'Education', status: 'More Info Needed', tone: 'bg-warning-soft text-warning', Icon: CircleHelp },
  ];
  return (
    <figure className="relative" aria-label="Illustration of the SchemeSetu dashboard">
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand-200/60 via-indigo-100/50 to-transparent blur-2xl" aria-hidden />
      <div className="card overflow-hidden p-0 shadow-lift">
        <div className="flex items-center gap-1.5 border-b border-line bg-slate-50 px-4 py-2.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          <span className="ml-3 h-5 flex-1 rounded-md bg-white" />
        </div>
        <div className="space-y-3 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-ink-muted">Your matches</p>
              <p className="font-bold">Recommended for you</p>
            </div>
            <span className="chip bg-brand-50 text-brand-700">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> Rule-based
            </span>
          </div>
          {rows.map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.12 }}
              className="flex items-center justify-between gap-3 rounded-xl border border-line p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{r.name}</p>
                <p className="text-xs text-ink-muted">{r.tag}</p>
              </div>
              <span className={`chip shrink-0 ${r.tone}`}>
                <r.Icon className="h-3.5 w-3.5" aria-hidden />
                {r.status}
              </span>
            </motion.div>
          ))}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="rounded-xl bg-brand-50 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
                <ListChecks className="h-3.5 w-3.5" aria-hidden /> Documents
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-white">
                <div className="h-1.5 w-2/3 rounded-full bg-brand-600" />
              </div>
            </div>
            <div className="rounded-xl bg-indigo-50 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700">
                <CalendarClock className="h-3.5 w-3.5" aria-hidden /> Next deadline
              </p>
              <p className="mt-1 text-sm font-bold text-indigo-800">Tracked for you</p>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-ink-muted">Illustrative preview with example entries</figcaption>
    </figure>
  );
}

const steps = [
  { Icon: UserRoundPlus, title: 'Create your profile', text: 'Answer a few optional questions about your state, studies and family income. Skip anything you prefer not to share.' },
  { Icon: Search, title: 'Discover matching schemes', text: 'Our rule engine checks each scheme’s published conditions and explains, criterion by criterion, why you match.' },
  { Icon: ClipboardCheck, title: 'Prepare and track', text: 'Save schemes, tick off documents as you gather them and keep your own record of application progress.' },
];

const features = [
  { Icon: Scale, title: 'Transparent eligibility', text: 'See exactly which conditions you meet, which you don’t, and what information is missing — no mystery scores.' },
  { Icon: Search, title: 'Smart discovery', text: 'Search and filter central and state schemes by category, state, education level and benefit type.' },
  { Icon: CalendarClock, title: 'Deadline tracking', text: 'Upcoming, expired and unverified deadlines in one place, counted in Indian Standard Time.' },
  { Icon: ListChecks, title: 'Document checklists', text: 'Know what to prepare for each scheme. We never ask you to upload certificates.' },
  { Icon: Bot, title: 'Plain-language explanations', text: 'Ask questions about a scheme — including in Hindi — answered only from the scheme record.' },
  { Icon: BellRing, title: 'Application progress', text: 'Track your applications from “Interested” to “Approved”, with notes and a status history.' },
];

const categories = [
  { value: 'education', label: 'Education', Icon: GraduationCap, tint: 'from-brand-500 to-brand-700' },
  { value: 'financial_assistance', label: 'Financial Assistance', Icon: HandCoins, tint: 'from-amber-500 to-orange-600' },
  { value: 'women_empowerment', label: 'Women Empowerment', Icon: Flower2, tint: 'from-pink-500 to-rose-600' },
  { value: 'disability_support', label: 'Disability Support', Icon: Accessibility, tint: 'from-sky-500 to-blue-600' },
  { value: 'employment_skills', label: 'Employment & Skills', Icon: BriefcaseBusiness, tint: 'from-indigo-500 to-violet-600' },
  { value: 'social_welfare', label: 'Social Welfare', Icon: HeartHandshake, tint: 'from-emerald-500 to-teal-600' },
];

const portals = [
  { name: 'National Scholarship Portal', url: 'https://scholarships.gov.in', text: 'Central and many state scholarships are applied for here.' },
  { name: 'myScheme', url: 'https://www.myscheme.gov.in', text: 'Government of India’s national platform for scheme information.' },
  { name: 'National Portal of India', url: 'https://www.india.gov.in', text: 'Official gateway to government services and information.' },
];

export default function LandingPage() {
  const { user } = useAuth();
  const findTarget = user ? '/dashboard' : '/register';

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 via-white to-canvas" aria-hidden />
        <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden />
        <div className="container-page grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="chip mb-5 border border-brand-200 bg-white px-3 py-1 text-brand-700">
              <ShieldCheck className="h-4 w-4" aria-hidden /> Scholarships &amp; welfare schemes, explained
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-[3.4rem] text-balance">
              Your Opportunities. <span className="bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">Your Eligibility.</span> One Platform.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-muted">
              Discover scholarships and government welfare schemes that match your profile. Understand eligibility, prepare
              documents, and never lose track of an opportunity.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to={findTarget} className="btn-primary min-h-[3.25rem] px-6 text-base">
                Find My Schemes <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
              <Link to="/schemes" className="btn-secondary min-h-[3.25rem] px-6 text-base">
                Explore All Schemes
              </Link>
            </div>
            <ul className="mt-8 grid gap-2 text-sm text-ink-soft sm:grid-cols-2">
              {['Free to use', 'No Aadhaar or bank details asked', 'Explains every eligibility rule', 'Links to official portals'].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-600" aria-hidden /> {t}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }}>
            <HeroPreview />
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 py-16 sm:py-20">
        <div className="container-page">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">How it works</p>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Three steps to the benefits you deserve</h2>
          </motion.div>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <motion.li key={s.title} {...fadeUp} transition={{ duration: 0.45, delay: i * 0.08 }} className="card relative p-6">
                <span className="absolute right-5 top-4 text-5xl font-extrabold text-brand-50" aria-hidden>
                  {i + 1}
                </span>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 text-white shadow-lift">
                  <s.Icon className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="mt-5 text-lg font-bold">
                  <span className="sr-only">Step {i + 1}: </span>
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-ink-muted">{s.text}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container-page">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">Features</p>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Everything you need, from discovery to application</h2>
          </motion.div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div key={f.title} {...fadeUp} transition={{ duration: 0.4, delay: (i % 3) * 0.06 }} className="rounded-2xl border border-line p-6 transition hover:border-brand-200 hover:shadow-lift">
                <f.Icon className="h-7 w-7 text-brand-600" aria-hidden />
                <h3 className="mt-4 font-bold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-ink-muted">{f.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 sm:py-20">
        <div className="container-page">
          <motion.div {...fadeUp} className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">Browse by category</p>
              <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Find support for every stage of life</h2>
            </div>
            <Link to="/schemes" className="link inline-flex items-center gap-1">
              View all schemes <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </motion.div>
          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.value}
                to={`/schemes?category=${c.value}`}
                className="card group flex flex-col gap-4 p-5 transition hover:-translate-y-1 hover:shadow-lift sm:flex-row sm:items-center"
              >
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${c.tint} text-white`}>
                  <c.Icon className="h-6 w-6" aria-hidden />
                </span>
                <span className="flex flex-1 items-center justify-between gap-2 font-bold">
                  {c.label}
                  <ArrowRight className="h-4 w-4 text-ink-muted transition group-hover:translate-x-1 group-hover:text-brand-600" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="bg-gradient-to-br from-brand-800 to-brand-900 py-16 text-white sm:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <motion.div {...fadeUp}>
            <ShieldCheck className="h-10 w-10 text-brand-200" aria-hidden />
            <h2 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">Honest by design</h2>
            <p className="mt-4 text-brand-100">
              SchemeSetu is an independent discovery tool, not a government portal. Eligibility results are preliminary and
              based only on the information you share and our record of each scheme. We never submit applications on your
              behalf, and every scheme links to its official source — which is always authoritative.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-brand-100">
              {['Each record shows whether it has been verified against the official source', 'Unknown deadlines are shown as “not verified”, never guessed', 'AI answers are grounded in the scheme record and labelled as AI'].map((t) => (
                <li key={t} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" aria-hidden /> {t}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div {...fadeUp} className="grid gap-3">
            <p className="text-sm font-semibold text-brand-200">Official portals</p>
            {portals.map((p) => (
              <a
                key={p.url}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-4 rounded-2xl border border-white/15 bg-white/5 p-5 transition hover:bg-white/10"
              >
                <span>
                  <span className="block font-bold text-white">{p.name}</span>
                  <span className="mt-0.5 block text-sm text-brand-100">{p.text}</span>
                </span>
                <ExternalLink className="h-5 w-5 shrink-0 text-brand-200" aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20">
        <div className="container-page">
          <motion.div {...fadeUp} className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-brand-600 px-6 py-12 text-center text-white sm:px-12">
            <Users className="mx-auto h-10 w-10 text-white/80" aria-hidden />
            <h2 className="mt-4 text-3xl font-extrabold text-white">Start with one profile</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/85">It takes about three minutes. Every question is optional, and you can change or delete your data any time.</p>
            <Link to={findTarget} className="btn mt-7 bg-white px-6 text-base text-brand-800 hover:bg-brand-50">
              Find My Schemes <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
