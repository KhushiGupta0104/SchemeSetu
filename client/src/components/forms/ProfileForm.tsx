import { useEffect, useState, type ReactNode } from 'react';
import { useForm, Controller, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Info, Lock, Pencil } from 'lucide-react';
import type { Meta, Profile } from '@/types';
import { RadioCards, SelectField, TextField } from '@/components/common/FormControls';
import { Spinner } from '@/components/common/States';
import { labelOf, formatINR } from '@/utils/format';
import { cn } from '@/utils/cn';

const optionalInt = (min: number, max: number, msg: string) =>
  z.string().trim().refine((v) => v === '' || (/^\d+$/.test(v) && Number(v) >= min && Number(v) <= max), msg);

export const profileFormSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(80),
    ageMode: z.enum(['age', 'dob']),
    dateOfBirth: z.string().refine((v) => v === '' || (/^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(v) < new Date()), 'Enter a valid date of birth in the past.'),
    age: optionalInt(5, 120, 'Age must be a whole number between 5 and 120.'),
    state: z.string(),
    district: z.string().trim().max(80, 'District name is too long.'),
    gender: z.string(),
    residenceType: z.string(),
    educationLevel: z.string(),
    course: z.string().trim().max(120, 'Course name is too long.'),
    courseStream: z.string(),
    institutionType: z.string(),
    academicYear: optionalInt(1, 10, 'Year of study must be between 1 and 10.'),
    previousExamPercentage: z.string().trim().refine((v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100), 'Enter a percentage between 0 and 100.'),
    employmentStatus: z.string(),
    incomeBracket: z.string(),
    annualIncome: optionalInt(0, 100_000_000, 'Enter your annual family income in rupees, digits only.'),
    socialCategory: z.string(),
    minorityCommunity: z.string(),
    disabilityStatus: z.string(),
    occupation: z.string(),
  })
  .refine((v) => !(v.annualIncome && !v.incomeBracket), { path: ['incomeBracket'], message: 'Choose the bracket your exact income falls in.' });

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

const s = (v: unknown) => (v === undefined || v === null ? '' : String(v));

export function toFormValues(name: string, p: Profile): ProfileFormValues {
  return {
    name,
    ageMode: p.dateOfBirth ? 'dob' : 'age',
    dateOfBirth: s(p.dateOfBirth),
    age: s(p.age),
    state: s(p.state),
    district: s(p.district),
    gender: s(p.gender),
    residenceType: s(p.residenceType),
    educationLevel: s(p.educationLevel),
    course: s(p.course),
    courseStream: s(p.courseStream),
    institutionType: s(p.institutionType),
    academicYear: s(p.academicYear),
    previousExamPercentage: s(p.previousExamPercentage),
    employmentStatus: s(p.employmentStatus),
    incomeBracket: s(p.incomeBracket),
    annualIncome: s(p.annualIncome),
    socialCategory: s(p.socialCategory),
    minorityCommunity: s(p.minorityCommunity),
    disabilityStatus: s(p.disabilityStatus),
    occupation: s(p.occupation),
  };
}

/** Converts form values to the API payload. Empty answers become null (clears the field). */
export function toPayload(v: ProfileFormValues) {
  const str = (x: string) => (x.trim() === '' ? null : x.trim());
  const num = (x: string) => (x.trim() === '' ? null : Number(x));
  return {
    name: v.name.trim(),
    profile: {
      dateOfBirth: v.ageMode === 'dob' ? str(v.dateOfBirth) : null,
      age: v.ageMode === 'age' ? num(v.age) : null,
      state: str(v.state),
      district: str(v.district),
      gender: str(v.gender),
      residenceType: str(v.residenceType),
      educationLevel: str(v.educationLevel),
      course: str(v.course),
      courseStream: str(v.courseStream),
      institutionType: str(v.institutionType),
      academicYear: num(v.academicYear),
      previousExamPercentage: num(v.previousExamPercentage),
      employmentStatus: str(v.employmentStatus),
      incomeBracket: str(v.incomeBracket),
      annualIncome: num(v.annualIncome),
      socialCategory: str(v.socialCategory),
      minorityCommunity: str(v.minorityCommunity),
      disabilityStatus: str(v.disabilityStatus),
      occupation: str(v.occupation),
    },
  };
}

function Why({ children }: { children: ReactNode }) {
  return (
    <p className="flex gap-2 rounded-xl bg-brand-50/70 p-3 text-[0.8125rem] text-ink-soft">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden /> <span>{children}</span>
    </p>
  );
}

type Form = UseFormReturn<ProfileFormValues>;

function BasicStep({ form, meta }: { form: Form; meta: Meta }) {
  const { register, watch, control, formState: { errors } } = form;
  const ageMode = watch('ageMode');
  return (
    <div className="space-y-5">
      <TextField label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />
      <div>
        <Controller
          control={control}
          name="ageMode"
          render={({ field }) => (
            <RadioCards
              name="ageMode"
              legend="How would you like to share your age?"
              help="Many schemes have age limits. Date of birth keeps your age accurate over time."
              options={[{ value: 'age', label: 'Enter my age' }, { value: 'dob', label: 'Enter date of birth' }]}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <div className="mt-3">
          {ageMode === 'dob' ? (
            <TextField label="Date of birth" type="date" optional max={new Date().toISOString().slice(0, 10)} error={errors.dateOfBirth?.message} {...register('dateOfBirth')} />
          ) : (
            <TextField label="Age (years)" inputMode="numeric" optional error={errors.age?.message} {...register('age')} />
          )}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField label="State / UT of domicile" optional options={meta.states} help="State schemes are only open to residents of that state." error={errors.state?.message} {...register('state')} />
        <TextField label="District" optional autoComplete="address-level2" error={errors.district?.message} {...register('district')} />
      </div>
      <Controller control={control} name="gender" render={({ field }) => (
        <RadioCards name="gender" legend="Gender" help="Some schemes are reserved for girls and women." options={meta.genders} value={field.value} onChange={field.onChange} />
      )} />
      <Controller control={control} name="residenceType" render={({ field }) => (
        <RadioCards name="residenceType" legend="Where do you live?" options={meta.residenceTypes} value={field.value} onChange={field.onChange} columns={3} />
      )} />
    </div>
  );
}

function EducationStep({ form, meta }: { form: Form; meta: Meta }) {
  const { register, formState: { errors } } = form;
  return (
    <div className="space-y-5">
      <Why>Scholarships are usually linked to your level of study, course type and marks. Skip anything that doesn&apos;t apply.</Why>
      <SelectField label="Current education level" optional options={meta.educationLevels} error={errors.educationLevel?.message} {...register('educationLevel')} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Course name" optional placeholder="e.g. B.Sc. Physics" error={errors.course?.message} {...register('course')} />
        <SelectField label="Course stream" optional options={meta.courseStreams} error={errors.courseStream?.message} {...register('courseStream')} />
        <SelectField label="Institution type" optional options={meta.institutionTypes} error={errors.institutionType?.message} {...register('institutionType')} />
        <TextField label="Current year of study" optional inputMode="numeric" placeholder="e.g. 1" error={errors.academicYear?.message} {...register('academicYear')} />
        <TextField label="Marks in last exam (%)" optional inputMode="decimal" placeholder="e.g. 78" error={errors.previousExamPercentage?.message} {...register('previousExamPercentage')} />
        <SelectField label="Employment status" optional options={meta.employmentStatuses} error={errors.employmentStatus?.message} {...register('employmentStatus')} />
      </div>
    </div>
  );
}

function FinancialStep({ form, meta }: { form: Form; meta: Meta }) {
  const { register, control, watch, formState: { errors } } = form;
  const [showExact, setShowExact] = useState(Boolean(watch('annualIncome')));
  return (
    <div className="space-y-5">
      <Why>
        These details help match need-based and reserved schemes. All are optional — &quot;Prefer not to say&quot; is never counted
        against you; we&apos;ll simply show &quot;more information needed&quot; where it matters. We never ask for certificates.
      </Why>
      <SelectField label="Annual family income" optional options={meta.incomeBrackets} help="Most need-based schemes have an income ceiling." error={errors.incomeBracket?.message} {...register('incomeBracket')} />
      <div>
        <button type="button" className="text-sm font-semibold text-brand-700 hover:underline" aria-expanded={showExact} onClick={() => setShowExact((x) => !x)}>
          {showExact ? 'Hide exact income' : 'I know my exact annual family income (optional)'}
        </button>
        {showExact && (
          <div className="mt-3">
            <TextField
              label="Exact annual family income (₹)"
              optional
              inputMode="numeric"
              placeholder="e.g. 240000"
              help="Helps when a scheme's income limit falls inside your bracket. Must be within the bracket chosen above."
              error={errors.annualIncome?.message}
              {...register('annualIncome')}
            />
          </div>
        )}
      </div>
      <Controller control={control} name="socialCategory" render={({ field }) => (
        <RadioCards name="socialCategory" legend="Social category" help="Some schemes are for SC, ST, OBC or EWS applicants." options={meta.socialCategories} value={field.value} onChange={field.onChange} columns={3} />
      )} />
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField label="Minority community" optional options={meta.minorityCommunities} help="Used only for minority scholarship schemes." {...register('minorityCommunity')} />
        <SelectField label="Occupation" optional options={meta.occupations} help="For schemes aimed at farmers, vendors, artisans and others." {...register('occupation')} />
      </div>
      <Controller control={control} name="disabilityStatus" render={({ field }) => (
        <RadioCards name="disabilityStatus" legend="Disability status" help="Disability support schemes usually require 40% or more disability." options={meta.disabilityStatuses} value={field.value} onChange={field.onChange} />
      )} />
    </div>
  );
}

function ReviewStep({ values, meta, goTo }: { values: ProfileFormValues; meta: Meta; goTo: (i: number) => void }) {
  const show = (v: string) => v || <span className="text-ink-muted">Not provided</span>;
  const income = values.annualIncome ? `${formatINR(Number(values.annualIncome))} (exact)` : labelOf(meta.incomeBrackets, values.incomeBracket, '');
  const groups: Array<{ title: string; step: number; rows: Array<[string, ReactNode]> }> = [
    {
      title: 'Basic details',
      step: 0,
      rows: [
        ['Name', values.name],
        [values.ageMode === 'dob' ? 'Date of birth' : 'Age', show(values.ageMode === 'dob' ? values.dateOfBirth : values.age)],
        ['State / UT', show(values.state)],
        ['District', show(values.district)],
        ['Gender', show(labelOf(meta.genders, values.gender, ''))],
        ['Residence', show(labelOf(meta.residenceTypes, values.residenceType, ''))],
      ],
    },
    {
      title: 'Education & work',
      step: 1,
      rows: [
        ['Education level', show(labelOf(meta.educationLevels, values.educationLevel, ''))],
        ['Course', show(values.course)],
        ['Stream', show(labelOf(meta.courseStreams, values.courseStream, ''))],
        ['Institution', show(labelOf(meta.institutionTypes, values.institutionType, ''))],
        ['Year of study', show(values.academicYear)],
        ['Last exam marks', show(values.previousExamPercentage ? `${values.previousExamPercentage}%` : '')],
        ['Employment', show(labelOf(meta.employmentStatuses, values.employmentStatus, ''))],
      ],
    },
    {
      title: 'Financial & eligibility',
      step: 2,
      rows: [
        ['Family income', show(income)],
        ['Social category', show(labelOf(meta.socialCategories, values.socialCategory, ''))],
        ['Minority community', show(labelOf(meta.minorityCommunities, values.minorityCommunity, ''))],
        ['Disability', show(labelOf(meta.disabilityStatuses, values.disabilityStatus, ''))],
        ['Occupation', show(labelOf(meta.occupations, values.occupation, ''))],
      ],
    },
  ];
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <section key={g.title} className="rounded-2xl border border-line p-4" aria-label={g.title}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-bold">{g.title}</h3>
            <button type="button" className="btn-ghost btn-sm" onClick={() => goTo(g.step)}>
              <Pencil className="h-4 w-4" aria-hidden /> Edit
            </button>
          </div>
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {g.rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-dashed border-line py-1.5 sm:block sm:border-0 sm:py-0">
                <dt className="text-ink-muted">{k}</dt>
                <dd className="text-right font-medium sm:text-left">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

const STEPS = [
  { title: 'Basic details', fields: ['name', 'dateOfBirth', 'age', 'state', 'district'] as const },
  { title: 'Education', fields: ['educationLevel', 'course', 'academicYear', 'previousExamPercentage'] as const },
  { title: 'Financial & eligibility', fields: ['incomeBracket', 'annualIncome'] as const },
  { title: 'Review & save', fields: [] as const },
];

export function ProfileForm({
  meta,
  initial,
  mode,
  submitting,
  onSubmit,
  serverErrors,
}: {
  meta: Meta;
  initial: ProfileFormValues;
  mode: 'wizard' | 'edit';
  submitting: boolean;
  onSubmit: (v: ProfileFormValues) => void;
  serverErrors?: Array<{ path: string; message: string }>;
}) {
  const form = useForm<ProfileFormValues>({ resolver: zodResolver(profileFormSchema), defaultValues: initial, mode: 'onTouched' });
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    serverErrors?.forEach((e) => {
      const key = e.path.replace(/^profile\./, '') as keyof ProfileFormValues;
      if (key in initial) form.setError(key, { message: e.message });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverErrors]);

  const go = async (next: number) => {
    if (next > step) {
      const ok = await form.trigger(STEPS[step].fields as unknown as (keyof ProfileFormValues)[]);
      if (!ok) return;
    }
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  if (mode === 'edit') {
    return (
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
        <Privacy />
        {[
          { title: 'Basic details', el: <BasicStep form={form} meta={meta} /> },
          { title: 'Education & work', el: <EducationStep form={form} meta={meta} /> },
          { title: 'Financial & eligibility details', el: <FinancialStep form={form} meta={meta} /> },
        ].map((sct) => (
          <section key={sct.title} className="card p-5 sm:p-6" aria-label={sct.title}>
            <h2 className="mb-5 text-lg font-bold">{sct.title}</h2>
            {sct.el}
          </section>
        ))}
        <div className="sticky bottom-4 z-10 flex justify-end">
          <button type="submit" className="btn-primary min-h-[3rem] px-6 shadow-lift" disabled={submitting}>
            {submitting ? <Spinner /> : <Check className="h-5 w-5" aria-hidden />} Save changes
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <ol className="mb-6 grid grid-cols-4 gap-2" aria-label="Onboarding steps">
        {STEPS.map((st, i) => (
          <li key={st.title} aria-current={i === step ? 'step' : undefined}>
            <div className={cn('h-1.5 rounded-full transition-colors', i <= step ? 'bg-brand-600' : 'bg-slate-200')} />
            <p className={cn('mt-2 hidden text-xs font-semibold sm:block', i === step ? 'text-brand-700' : 'text-ink-muted')}>
              {i + 1}. {st.title}
            </p>
          </li>
        ))}
      </ol>
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-600 sm:hidden">
        Step {step + 1} of {STEPS.length}
      </p>
      <h2 className="mb-5 text-xl font-bold" aria-live="polite">
        {STEPS[step].title}
      </h2>
      {step === 0 && <Privacy />}

      <div className="mt-5 overflow-hidden">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -24 }}
            transition={{ duration: 0.22 }}
          >
            {step === 0 && <BasicStep form={form} meta={meta} />}
            {step === 1 && <EducationStep form={form} meta={meta} />}
            {step === 2 && <FinancialStep form={form} meta={meta} />}
            {step === 3 && <ReviewStep values={form.getValues()} meta={meta} goTo={(i) => go(i)} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
        <button type="button" className="btn-ghost" onClick={() => go(step - 1)} disabled={step === 0}>
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back
        </button>
        {step < STEPS.length - 1 ? (
          <button type="button" className="btn-primary px-6" onClick={() => go(step + 1)}>
            Continue <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        ) : (
          <button type="submit" className="btn-primary px-6" disabled={submitting}>
            {submitting ? <Spinner /> : <Check className="h-4 w-4" aria-hidden />} Save &amp; see my schemes
          </button>
        )}
      </div>
    </form>
  );
}

function Privacy() {
  return (
    <p className="flex gap-2.5 rounded-xl border border-line bg-white p-3.5 text-[0.8125rem] text-ink-soft">
      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
      <span>
        Every question is optional. SchemeSetu never asks for Aadhaar numbers, bank account numbers or certificates. Your
        profile is private and used only to check scheme eligibility. You can edit or delete it at any time.
      </span>
    </p>
  );
}
