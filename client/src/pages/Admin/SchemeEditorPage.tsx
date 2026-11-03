import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminApi } from '@/services/endpoints';
import { ApiError, errorMessage } from '@/services/api';
import { useMeta } from '@/hooks/queries';
import type { AdminSchemeDetail, Meta, SchemeInput } from '@/types';
import { PageHeader } from '@/components/common/Layout';
import { ErrorState, PageLoader, Spinner } from '@/components/common/States';
import { RuleBuilder } from './RuleBuilder';

const EMPTY: SchemeInput = {
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  category: 'education',
  tags: [],
  provider: '',
  providerType: 'central_government',
  isAllIndia: true,
  applicableStates: [],
  educationLevels: [],
  benefitType: 'scholarship',
  benefitSummary: '',
  benefits: [],
  eligibilityRules: { op: 'all', conditions: [] },
  additionalCriteria: [],
  requiredDocuments: [],
  applicationSteps: [],
  applicationOpenDate: null,
  applicationDeadline: null,
  applicationWindowStatus: 'not_verified',
  officialSourceUrl: '',
  applicationUrl: null,
  sourceVerifiedAt: null,
  verificationStatus: 'needs_review',
  verificationNotes: '',
  isDemo: false,
  publicationStatus: 'draft',
};

const d = (v: string | null) => (v ? v.slice(0, 10) : null);

function fromDetail(s: AdminSchemeDetail): SchemeInput {
  return {
    name: s.name,
    slug: s.slug,
    shortDescription: s.shortDescription,
    description: s.description,
    category: s.category,
    tags: s.tags,
    provider: s.provider,
    providerType: s.providerType,
    isAllIndia: s.isAllIndia,
    applicableStates: s.applicableStates,
    educationLevels: s.educationLevels,
    benefitType: s.benefitType,
    benefitSummary: s.benefitSummary,
    benefits: s.benefits,
    eligibilityRules: s.eligibilityRules ?? { op: 'all', conditions: [] },
    additionalCriteria: s.additionalCriteria,
    requiredDocuments: s.requiredDocuments,
    applicationSteps: s.applicationSteps,
    applicationOpenDate: d(s.applicationOpenDate),
    applicationDeadline: d(s.applicationDeadline),
    applicationWindowStatus: s.applicationWindowStatus,
    officialSourceUrl: s.officialSourceUrl,
    applicationUrl: s.applicationUrl,
    sourceVerifiedAt: d(s.sourceVerifiedAt),
    verificationStatus: s.verificationStatus,
    verificationNotes: s.verificationNotes,
    isDemo: s.isDemo,
    publicationStatus: s.publicationStatus,
  };
}

function Card({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="card p-5 sm:p-6" aria-label={title}>
      <h2 className="text-lg font-bold">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function Err({ errors, path }: { errors: Record<string, string>; path: string }) {
  return errors[path] ? <p className="field-error" role="alert"><AlertCircle className="h-3.5 w-3.5" aria-hidden /> {errors[path]}</p> : null;
}

function Input({ label, value, onChange, path, errors, type = 'text', help, required, ...rest }: { label: string; value: string; onChange: (v: string) => void; path: string; errors: Record<string, string>; type?: string; help?: string; required?: boolean; placeholder?: string; maxLength?: number }) {
  return (
    <div>
      <label htmlFor={`se-${path}`} className="label">{label}{required && <span className="text-danger" aria-hidden> *</span>}</label>
      <input id={`se-${path}`} type={type} className="input" value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(errors[path])} required={required} {...rest} />
      {help && !errors[path] && <p className="help">{help}</p>}
      <Err errors={errors} path={path} />
    </div>
  );
}

function Select({ label, value, onChange, options, path, errors, help }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; path: string; errors: Record<string, string>; help?: string }) {
  return (
    <div>
      <label htmlFor={`se-${path}`} className="label">{label}</label>
      <select id={`se-${path}`} className="input" value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(errors[path])}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {help && <p className="help">{help}</p>}
      <Err errors={errors} path={path} />
    </div>
  );
}

/** Editable list of short text items (benefits, steps, criteria). */
function ListEditor({ label, items, onChange, placeholder, path, errors }: { label: string; items: string[]; onChange: (v: string[]) => void; placeholder: string; path: string; errors: Record<string, string> }) {
  const move = (i: number, dir: -1 | 1) => {
    const next = [...items];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <ol className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <label htmlFor={`${path}-${i}`} className="sr-only">{`${label} ${i + 1}`}</label>
            <textarea id={`${path}-${i}`} rows={1} className="input min-h-[2.75rem] flex-1 text-sm" value={it} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
            <div className="flex shrink-0 gap-1">
              <button type="button" className="btn-ghost btn-sm px-1.5" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="h-4 w-4" aria-hidden /></button>
              <button type="button" className="btn-ghost btn-sm px-1.5" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="h-4 w-4" aria-hidden /></button>
              <button type="button" className="btn-ghost btn-sm px-1.5 text-danger" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove"><Trash2 className="h-4 w-4" aria-hidden /></button>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="btn-secondary btn-sm mt-2" onClick={() => onChange([...items, ''])}><Plus className="h-4 w-4" aria-hidden /> {placeholder}</button>
      <Err errors={errors} path={path} />
    </fieldset>
  );
}

function MultiCheck({ label, options, selected, onChange, help }: { label: string; options: { value: string; label: string }[]; selected: string[]; onChange: (v: string[]) => void; help?: string }) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      {help && <p className="help -mt-1 mb-2">{help}</p>}
      <div className="grid max-h-56 gap-1 overflow-y-auto rounded-xl border border-line p-3 sm:grid-cols-2">
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-brand-600" checked={selected.includes(o.value)} onChange={(e) => onChange(e.target.checked ? [...selected, o.value] : selected.filter((x) => x !== o.value))} />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function EditorForm({ meta, initial, id }: { meta: Meta; initial: SchemeInput; id?: string }) {
  const [form, setForm] = useState<SchemeInput>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorList, setErrorList] = useState<string[]>([]);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const set = <K extends keyof SchemeInput>(k: K, v: SchemeInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: (body: SchemeInput) => (id ? AdminApi.update(id, body) : AdminApi.create(body)),
    onSuccess: async (data) => {
      toast.success(id ? 'Scheme updated' : 'Scheme created');
      await Promise.all([qc.invalidateQueries({ queryKey: ['admin'] }), qc.invalidateQueries({ queryKey: ['schemes'] }), qc.invalidateQueries({ queryKey: ['scheme'] }), qc.invalidateQueries({ queryKey: ['eligibility'] }), qc.invalidateQueries({ queryKey: ['recommendations'] }), qc.invalidateQueries({ queryKey: ['dashboard'] })]);
      if (!id) navigate(`/admin/schemes/${data.id}/edit`, { replace: true });
      else setForm(fromDetail(data as AdminSchemeDetail));
    },
    onError: (err) => {
      const map: Record<string, string> = {};
      const list: string[] = [];
      if (err instanceof ApiError && err.details) {
        err.details.forEach((x) => {
          map[x.path.split('.')[0]] = x.message;
          list.push(`${x.path ? `${x.path}: ` : ''}${x.message}`);
        });
      } else list.push(errorMessage(err));
      setErrors(map);
      setErrorList(list);
      toast.error('Please fix the highlighted problems');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  const submit = (publicationStatus?: 'draft' | 'published') => {
    setErrors({});
    setErrorList([]);
    const clean = (a: string[]) => a.map((x) => x.trim()).filter(Boolean);
    const body: SchemeInput = {
      ...form,
      publicationStatus: publicationStatus ?? form.publicationStatus,
      slug: form.slug?.trim() || undefined,
      benefits: clean(form.benefits),
      additionalCriteria: clean(form.additionalCriteria),
      applicationSteps: clean(form.applicationSteps),
      tags: clean(form.tags),
      requiredDocuments: form.requiredDocuments.filter((x) => x.name.trim()),
      applicationUrl: form.applicationUrl?.trim() || null,
      applicationOpenDate: form.applicationOpenDate || null,
      applicationDeadline: form.applicationDeadline || null,
      sourceVerifiedAt: form.sourceVerifiedAt || null,
      applicableStates: form.isAllIndia ? [] : form.applicableStates,
    };
    save.mutate(body);
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate className="space-y-6">
      {errorList.length > 0 && (
        <div role="alert" className="rounded-2xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">
          <p className="font-bold">The scheme could not be saved:</p>
          <ul className="mt-1 list-disc pl-5">{errorList.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      )}

      <Card title="Basics">
        <Input label="Scheme name" required value={form.name} onChange={(v) => set('name', v)} path="name" errors={errors} maxLength={200} />
        <Input label="Slug (URL)" value={form.slug ?? ''} onChange={(v) => set('slug', v)} path="slug" errors={errors} help="Leave empty to generate from the name. Lowercase letters, numbers and hyphens." />
        <Input label="Short description" required value={form.shortDescription} onChange={(v) => set('shortDescription', v)} path="shortDescription" errors={errors} maxLength={300} />
        <div>
          <label htmlFor="se-description" className="label">Full description<span className="text-danger" aria-hidden> *</span></label>
          <textarea id="se-description" rows={5} className="input" value={form.description} onChange={(e) => set('description', e.target.value)} aria-invalid={Boolean(errors.description)} maxLength={5000} />
          <Err errors={errors} path="description" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Select label="Category" value={form.category} onChange={(v) => set('category', v)} options={meta.schemeCategories} path="category" errors={errors} />
          <Input label="Keywords" value={form.tags.join(', ')} onChange={(v) => set('tags', v.split(','))} path="tags" errors={errors} help="Comma-separated, used for search." />
          <Input label="Provider name" required value={form.provider} onChange={(v) => set('provider', v)} path="provider" errors={errors} />
          <Select label="Provider type" value={form.providerType} onChange={(v) => set('providerType', v)} options={meta.providerTypes} path="providerType" errors={errors} />
        </div>
      </Card>

      <Card title="Geography & audience">
        <label className="flex items-center gap-2.5 text-sm font-semibold">
          <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={form.isAllIndia} onChange={(e) => set('isAllIndia', e.target.checked)} /> Available across India
        </label>
        {!form.isAllIndia && (
          <>
            <MultiCheck label="Applicable states / UTs" options={meta.states} selected={form.applicableStates} onChange={(v) => set('applicableStates', v)} help="State of domicile is checked automatically as a mandatory eligibility criterion." />
            <Err errors={errors} path="applicableStates" />
          </>
        )}
        <MultiCheck label="Target education levels (for explorer filters)" options={meta.educationLevels} selected={form.educationLevels} onChange={(v) => set('educationLevels', v)} help="Leave empty if the scheme is not tied to education. Use eligibility rules to enforce levels." />
      </Card>

      <Card title="Benefits">
        <div className="grid gap-5 sm:grid-cols-[14rem_1fr]">
          <Select label="Benefit type" value={form.benefitType} onChange={(v) => set('benefitType', v)} options={meta.benefitTypes} path="benefitType" errors={errors} />
          <Input label="Benefit summary" required value={form.benefitSummary} onChange={(v) => set('benefitSummary', v)} path="benefitSummary" errors={errors} maxLength={300} />
        </div>
        <ListEditor label="Benefit details" items={form.benefits} onChange={(v) => set('benefits', v)} placeholder="Add benefit" path="benefits" errors={errors} />
      </Card>

      <Card title="Eligibility rules" description="Evaluated by SchemeSetu's rule engine. Missing user data never counts as a failure.">
        <RuleBuilder meta={meta} value={form.eligibilityRules} onChange={(v) => set('eligibilityRules', v)} />
        <Err errors={errors} path="eligibilityRules" />
        <ListEditor label="Conditions users must check themselves" items={form.additionalCriteria} onChange={(v) => set('additionalCriteria', v)} placeholder="Add condition" path="additionalCriteria" errors={errors} />
      </Card>

      <Card title="Documents & application">
        <fieldset>
          <legend className="label">Required documents</legend>
          <p className="help -mt-1 mb-2">Each document keeps a stable id so users&apos; checklist progress survives renames.</p>
          <ul className="space-y-2">
            {form.requiredDocuments.map((doc, i) => (
              <li key={doc.docId ?? `new-${i}`} className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-center">
                <label className="sr-only" htmlFor={`doc-n-${i}`}>Document name</label>
                <input id={`doc-n-${i}`} className="input text-sm" placeholder="Document name" value={doc.name} onChange={(e) => set('requiredDocuments', form.requiredDocuments.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                <label className="sr-only" htmlFor={`doc-d-${i}`}>Description</label>
                <input id={`doc-d-${i}`} className="input text-sm" placeholder="Description (optional)" value={doc.description ?? ''} onChange={(e) => set('requiredDocuments', form.requiredDocuments.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="accent-brand-600" checked={Boolean(doc.optional)} onChange={(e) => set('requiredDocuments', form.requiredDocuments.map((x, j) => (j === i ? { ...x, optional: e.target.checked } : x)))} /> If applicable
                </label>
                <button type="button" className="btn-ghost btn-sm px-2 text-danger" aria-label="Remove document" onClick={() => set('requiredDocuments', form.requiredDocuments.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" aria-hidden /></button>
              </li>
            ))}
          </ul>
          <button type="button" className="btn-secondary btn-sm mt-2" onClick={() => set('requiredDocuments', [...form.requiredDocuments, { name: '', description: '', optional: false }])}><Plus className="h-4 w-4" aria-hidden /> Add document</button>
          <Err errors={errors} path="requiredDocuments" />
        </fieldset>
        <ListEditor label="Application steps" items={form.applicationSteps} onChange={(v) => set('applicationSteps', v)} placeholder="Add step" path="applicationSteps" errors={errors} />
      </Card>

      <Card title="Dates" description="Calendar dates in India (IST). Leave empty if not verified — never guess.">
        <div className="grid gap-5 sm:grid-cols-3">
          <Input label="Application opens" type="date" value={form.applicationOpenDate ?? ''} onChange={(v) => set('applicationOpenDate', v || null)} path="applicationOpenDate" errors={errors} />
          <Input label="Application deadline" type="date" value={form.applicationDeadline ?? ''} onChange={(v) => set('applicationDeadline', v || null)} path="applicationDeadline" errors={errors} />
          <Select label="Application window" value={form.applicationWindowStatus} onChange={(v) => set('applicationWindowStatus', v)} options={meta.windowStatuses} path="applicationWindowStatus" errors={errors} help="Only mark open/closed when confirmed on the official source." />
        </div>
      </Card>

      <Card title="Source & verification">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Official source URL" required type="url" value={form.officialSourceUrl} onChange={(v) => set('officialSourceUrl', v)} path="officialSourceUrl" errors={errors} placeholder="https://" />
          <Input label="Application URL" type="url" value={form.applicationUrl ?? ''} onChange={(v) => set('applicationUrl', v)} path="applicationUrl" errors={errors} placeholder="https://" />
          <Select label="Verification status" value={form.verificationStatus} onChange={(v) => set('verificationStatus', v)} options={meta.verificationStatuses} path="verificationStatus" errors={errors} />
          <div>
            <Input label="Verified on" type="date" value={form.sourceVerifiedAt ?? ''} onChange={(v) => set('sourceVerifiedAt', v || null)} path="sourceVerifiedAt" errors={errors} help="Required when marking as verified." />
            <button type="button" className="link mt-1 text-sm" onClick={() => setForm((f) => ({ ...f, sourceVerifiedAt: today, verificationStatus: f.isDemo ? f.verificationStatus : 'verified' }))}>Mark verified today</button>
          </div>
        </div>
        <div>
          <label htmlFor="se-vnotes" className="label">Verification notes</label>
          <textarea id="se-vnotes" rows={2} className="input text-sm" value={form.verificationNotes ?? ''} onChange={(e) => set('verificationNotes', e.target.value)} maxLength={1000} />
        </div>
        <label className="flex items-center gap-2.5 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={form.isDemo} onChange={(e) => set('isDemo', e.target.checked)} /> This is a hypothetical demo record (shown with a “Demo” label)
        </label>
      </Card>

      <div className="sticky bottom-4 z-10 flex flex-wrap justify-end gap-2 rounded-2xl border border-line bg-white/90 p-3 shadow-lift backdrop-blur">
        <span className="mr-auto self-center text-sm text-ink-muted">Currently: <strong>{form.publicationStatus === 'published' ? 'Published' : 'Draft'}</strong></span>
        <Link to="/admin/schemes" className="btn-ghost">Cancel</Link>
        <button type="button" className="btn-secondary" disabled={save.isPending} onClick={() => submit('draft')}>{form.publicationStatus === 'published' ? 'Unpublish & save draft' : 'Save draft'}</button>
        <button type="button" className="btn-primary" disabled={save.isPending} onClick={() => submit('published')}>
          {save.isPending ? <Spinner /> : <Save className="h-4 w-4" aria-hidden />} {form.publicationStatus === 'published' ? 'Save & keep published' : 'Save & publish'}
        </button>
      </div>
    </form>
  );
}

export default function SchemeEditorPage() {
  const { id } = useParams();
  const meta = useMeta();
  const scheme = useQuery({ queryKey: ['admin', 'scheme', id], queryFn: () => AdminApi.get(id!), enabled: Boolean(id) });
  const [key, setKey] = useState(0);
  useEffect(() => setKey((k) => k + 1), [scheme.data?.updatedAt]);

  if (meta.isLoading || (id && scheme.isLoading)) return <PageLoader />;
  if (meta.isError || scheme.isError) return <ErrorState error={meta.error ?? scheme.error} onRetry={() => { void meta.refetch(); void scheme.refetch(); }} />;

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title={id ? 'Edit scheme' : 'Add a scheme'}
        breadcrumbs={[{ label: 'Manage Schemes', to: '/admin/schemes' }, { label: id ? scheme.data?.name ?? 'Edit' : 'New scheme' }]}
        actions={id && scheme.data?.publicationStatus === 'published' ? <Link to={`/schemes/${scheme.data.slug}`} className="btn-secondary">View public page</Link> : undefined}
      />
      <EditorForm key={key} meta={meta.data!} initial={id && scheme.data ? fromDetail(scheme.data) : EMPTY} id={id} />
    </>
  );
}
