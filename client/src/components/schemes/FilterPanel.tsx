import { useEffect, useState, type ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import type { Meta, Option } from '@/types';

export interface ExplorerFilters {
  q: string;
  category: string[];
  state: string;
  educationLevel: string;
  providerType: string[];
  benefitType: string[];
  eligibility: string[];
  hasDeadline: '' | 'true' | 'false';
  acceptingOnly: boolean;
  hideDemo: boolean;
  sort: string;
}

export const EMPTY_FILTERS: ExplorerFilters = {
  q: '',
  category: [],
  state: '',
  educationLevel: '',
  providerType: [],
  benefitType: [],
  eligibility: [],
  hasDeadline: '',
  acceptingOnly: false,
  hideDemo: false,
  sort: 'relevance',
};

export function countActive(f: ExplorerFilters) {
  return (
    f.category.length + f.providerType.length + f.benefitType.length + f.eligibility.length +
    Number(Boolean(f.state)) + Number(Boolean(f.educationLevel)) + Number(Boolean(f.hasDeadline)) + Number(f.acceptingOnly) + Number(f.hideDemo)
  );
}

/** Debounced search input. */
export function SearchBar({ value, onChange, placeholder = 'Search by scheme, provider or keyword' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  useEffect(() => {
    if (local === value) return;
    const t = setTimeout(() => onChange(local), 350);
    return () => clearTimeout(t);
  }, [local, value, onChange]);

  return (
    <div className="relative" role="search">
      <label htmlFor="scheme-search" className="sr-only">
        Search schemes
      </label>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" aria-hidden />
      <input
        id="scheme-search"
        type="search"
        value={local}
        maxLength={100}
        onChange={(e) => setLocal(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onChange(local)}
        placeholder={placeholder}
        className="input min-h-[3rem] pl-11 pr-10 text-base"
      />
      {local && (
        <button type="button" onClick={() => { setLocal(''); onChange(''); }} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink-muted hover:bg-slate-100" aria-label="Clear search">
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-b border-line py-4 last:border-0">
      <legend className="mb-2 text-sm font-bold">{title}</legend>
      {children}
    </fieldset>
  );
}

function CheckList({ options, selected, onChange }: { options: Option[]; selected: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="space-y-1">
      {options.map((o) => (
        <label key={o.value} className="flex min-h-[2.25rem] cursor-pointer items-center gap-2.5 rounded-lg px-1 text-sm text-ink-soft hover:text-ink">
          <input
            type="checkbox"
            className="h-4 w-4 rounded accent-brand-600"
            checked={selected.includes(o.value)}
            onChange={(e) => onChange(e.target.checked ? [...selected, o.value] : selected.filter((v) => v !== o.value))}
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}

const ELIGIBILITY_OPTIONS: Option[] = [
  { value: 'LIKELY_ELIGIBLE', label: 'Likely eligible' },
  { value: 'MORE_INFORMATION_NEEDED', label: 'More information needed' },
  { value: 'NOT_ELIGIBLE', label: 'Not eligible' },
];

export function FilterPanel({
  meta,
  filters,
  onChange,
  personalised,
}: {
  meta: Meta;
  filters: ExplorerFilters;
  onChange: (f: Partial<ExplorerFilters>) => void;
  personalised: boolean;
}) {
  return (
    <div>
      <Group title="Category">
        <CheckList options={meta.schemeCategories} selected={filters.category} onChange={(category) => onChange({ category })} />
      </Group>
      <Group title="Your eligibility">
        {personalised ? (
          <CheckList options={ELIGIBILITY_OPTIONS} selected={filters.eligibility} onChange={(eligibility) => onChange({ eligibility })} />
        ) : (
          <p className="text-sm text-ink-muted">Log in and complete your profile to filter by eligibility.</p>
        )}
      </Group>
      <Group title="State / UT">
        <label htmlFor="f-state" className="sr-only">State</label>
        <select id="f-state" className="input" value={filters.state} onChange={(e) => onChange({ state: e.target.value })}>
          <option value="">Any state</option>
          {meta.states.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <p className="help">Shows all-India schemes plus schemes for this state.</p>
      </Group>
      <Group title="Education level">
        <label htmlFor="f-edu" className="sr-only">Education level</label>
        <select id="f-edu" className="input" value={filters.educationLevel} onChange={(e) => onChange({ educationLevel: e.target.value })}>
          <option value="">Any level</option>
          {meta.educationLevels.filter((e) => e.value !== 'not_studying').map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </Group>
      <Group title="Provider">
        <CheckList options={meta.providerTypes} selected={filters.providerType} onChange={(providerType) => onChange({ providerType })} />
      </Group>
      <Group title="Benefit type">
        <CheckList options={meta.benefitTypes} selected={filters.benefitType} onChange={(benefitType) => onChange({ benefitType })} />
      </Group>
      <Group title="Deadline">
        <div className="space-y-1">
          {[
            { v: '', l: 'Any' },
            { v: 'true', l: 'Has an upcoming deadline' },
            { v: 'false', l: 'Deadline not verified' },
          ].map((o) => (
            <label key={o.v} className="flex min-h-[2.25rem] cursor-pointer items-center gap-2.5 px-1 text-sm text-ink-soft">
              <input type="radio" name="deadline" className="h-4 w-4 accent-brand-600" checked={filters.hasDeadline === o.v} onChange={() => onChange({ hasDeadline: o.v as ExplorerFilters['hasDeadline'] })} />
              {o.l}
            </label>
          ))}
        </div>
        <label className="mt-2 flex min-h-[2.25rem] cursor-pointer items-center gap-2.5 px-1 text-sm text-ink-soft">
          <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={filters.acceptingOnly} onChange={(e) => onChange({ acceptingOnly: e.target.checked })} />
          Currently accepting applications (verified only)
        </label>
      </Group>
      <Group title="Data">
        <label className="flex min-h-[2.25rem] cursor-pointer items-center gap-2.5 px-1 text-sm text-ink-soft">
          <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={filters.hideDemo} onChange={(e) => onChange({ hideDemo: e.target.checked })} />
          Hide demo records
        </label>
      </Group>
    </div>
  );
}
