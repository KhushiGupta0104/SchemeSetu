import { useState } from 'react';
import { Braces, FolderPlus, Plus, Trash2 } from 'lucide-react';
import type { Meta, RuleCondition, RuleGroup, RuleNode } from '@/types';
import { cn } from '@/utils/cn';

const MAX_DEPTH = 4;
const isGroup = (n: RuleNode): n is RuleGroup => 'op' in n && 'conditions' in n;

function defaultValue(meta: Meta, field: string, operator: string): unknown {
  const def = meta.eligibilityFields.find((f) => f.key === field);
  if (!def || operator === 'exists') return undefined;
  if (def.type === 'number') return 0;
  const first = def.options?.find((o) => !['prefer_not_to_say', 'unknown'].includes(o.value))?.value ?? '';
  return operator === 'in' || operator === 'notIn' ? [first] : first;
}

function ConditionEditor({ meta, cond, onChange, onRemove, path }: { meta: Meta; cond: RuleCondition; onChange: (c: RuleCondition) => void; onRemove: () => void; path: string }) {
  const def = meta.eligibilityFields.find((f) => f.key === cond.field);
  const ops = def ? meta.operatorsByType[def.type] : [];
  const options = (def?.options ?? []).filter((o) => !['prefer_not_to_say', 'unknown'].includes(o.value));
  const multi = cond.operator === 'in' || cond.operator === 'notIn';
  const selected = Array.isArray(cond.value) ? (cond.value as string[]) : [];

  return (
    <div className="rounded-xl border border-line bg-white p-3">
      <div className="grid gap-2 md:grid-cols-[1fr_10rem_1fr_auto] md:items-start">
        <div>
          <label htmlFor={`${path}-f`} className="sr-only">Field</label>
          <select
            id={`${path}-f`}
            className="input min-h-[2.5rem] text-sm"
            value={cond.field}
            onChange={(e) => {
              const f = meta.eligibilityFields.find((x) => x.key === e.target.value)!;
              const op = meta.operatorsByType[f.type][0];
              onChange({ field: f.key, operator: op, value: defaultValue(meta, f.key, op) });
            }}
          >
            {meta.eligibilityFields.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`${path}-o`} className="sr-only">Operator</label>
          <select
            id={`${path}-o`}
            className="input min-h-[2.5rem] text-sm"
            value={cond.operator}
            onChange={(e) => {
              const op = e.target.value;
              let value = cond.value;
              const wasMulti = multi;
              const isMulti = op === 'in' || op === 'notIn';
              if (op === 'exists') value = undefined;
              else if (def?.type === 'enum' && wasMulti !== isMulti) value = isMulti ? (cond.value ? [cond.value] : selected) : selected[0] ?? defaultValue(meta, cond.field, op);
              else if (value === undefined) value = defaultValue(meta, cond.field, op);
              onChange({ ...cond, operator: op, value });
            }}
          >
            {ops.map((o) => <option key={o} value={o}>{meta.operatorLabels[o]}</option>)}
          </select>
        </div>
        <div>
          {cond.operator === 'exists' ? (
            <p className="py-2 text-sm text-ink-muted">No value needed</p>
          ) : def?.type === 'number' ? (
            <>
              <label htmlFor={`${path}-v`} className="sr-only">Value</label>
              <input
                id={`${path}-v`}
                type="number"
                className="input min-h-[2.5rem] text-sm"
                value={typeof cond.value === 'number' ? cond.value : ''}
                onChange={(e) => onChange({ ...cond, value: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
              <p className="help">{def.unit === 'inr' ? 'Annual amount in ₹' : def.unit === 'percent' ? 'Percent (0–100)' : def.unit === 'years' ? 'Years' : 'Year of study'}</p>
            </>
          ) : multi ? (
            <fieldset className="max-h-40 overflow-y-auto rounded-xl border border-line p-2">
              <legend className="sr-only">Values</legend>
              {options.map((o) => (
                <label key={o.value} className="flex items-center gap-2 py-0.5 text-sm">
                  <input
                    type="checkbox"
                    className="accent-brand-600"
                    checked={selected.includes(o.value)}
                    onChange={(e) => onChange({ ...cond, value: e.target.checked ? [...selected, o.value] : selected.filter((v) => v !== o.value) })}
                  />
                  {o.label}
                </label>
              ))}
            </fieldset>
          ) : (
            <>
              <label htmlFor={`${path}-v`} className="sr-only">Value</label>
              <select id={`${path}-v`} className="input min-h-[2.5rem] text-sm" value={String(cond.value ?? '')} onChange={(e) => onChange({ ...cond, value: e.target.value })}>
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </>
          )}
        </div>
        <button type="button" className="btn-ghost btn-sm px-2 text-danger" onClick={onRemove} aria-label="Remove condition">
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function GroupEditor({ meta, group, onChange, onRemove, depth, path }: { meta: Meta; group: RuleGroup; onChange: (g: RuleGroup) => void; onRemove?: () => void; depth: number; path: string }) {
  const setChild = (i: number, n: RuleNode) => onChange({ ...group, conditions: group.conditions.map((c, j) => (j === i ? n : c)) });
  const removeChild = (i: number) => onChange({ ...group, conditions: group.conditions.filter((_, j) => j !== i) });
  const addCondition = () => {
    const f = meta.eligibilityFields[0];
    const op = meta.operatorsByType[f.type][0];
    onChange({ ...group, conditions: [...group.conditions, { field: f.key, operator: op, value: defaultValue(meta, f.key, op) }] });
  };
  const addGroup = () => {
    const f = meta.eligibilityFields.find((x) => x.key === 'gender') ?? meta.eligibilityFields[0];
    const op = meta.operatorsByType[f.type][0];
    onChange({ ...group, conditions: [...group.conditions, { op: 'any', conditions: [{ field: f.key, operator: op, value: defaultValue(meta, f.key, op) }] }] });
  };

  return (
    <div className={cn('rounded-2xl border p-3 sm:p-4', depth === 1 ? 'border-line bg-slate-50' : group.op === 'any' ? 'border-indigo-200 bg-indigo-50/40' : 'border-brand-200 bg-brand-50/40')}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">{depth === 1 ? 'Applicant must satisfy' : 'Group:'}</span>
        <div role="radiogroup" aria-label="Group logic" className="inline-flex rounded-lg border border-line bg-white p-0.5">
          {(['all', 'any'] as const).map((op) => (
            <button key={op} type="button" role="radio" aria-checked={group.op === op} onClick={() => onChange({ ...group, op })} className={cn('rounded-md px-2.5 py-1 text-xs font-bold', group.op === op ? (op === 'all' ? 'bg-brand-600 text-white' : 'bg-indigo-600 text-white') : 'text-ink-soft')}>
              {op === 'all' ? 'ALL (AND)' : 'ANY (OR)'}
            </button>
          ))}
        </div>
        <span className="text-sm text-ink-muted">of these conditions</span>
        {onRemove && (
          <button type="button" className="btn-ghost btn-sm ml-auto px-2 text-danger" onClick={onRemove} aria-label="Remove group">
            <Trash2 className="h-4 w-4" aria-hidden /> <span className="hidden sm:inline">Remove group</span>
          </button>
        )}
      </div>
      <div className="space-y-2">
        {group.conditions.length === 0 && (
          <p className="rounded-xl border border-dashed border-line bg-white p-3 text-sm text-ink-muted">
            {depth === 1 ? 'No automated conditions — users will see "more information needed" and be asked to check the official source.' : 'Add at least one condition to this group.'}
          </p>
        )}
        {group.conditions.map((c, i) =>
          isGroup(c) ? (
            <GroupEditor key={i} meta={meta} group={c} depth={depth + 1} path={`${path}-${i}`} onChange={(g) => setChild(i, g)} onRemove={() => removeChild(i)} />
          ) : (
            <ConditionEditor key={i} meta={meta} cond={c} path={`${path}-${i}`} onChange={(n) => setChild(i, n)} onRemove={() => removeChild(i)} />
          ),
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn-secondary btn-sm" onClick={addCondition}><Plus className="h-4 w-4" aria-hidden /> Add condition</button>
        {depth < MAX_DEPTH && <button type="button" className="btn-secondary btn-sm" onClick={addGroup}><FolderPlus className="h-4 w-4" aria-hidden /> Add AND/OR group</button>}
      </div>
    </div>
  );
}

/** Visual eligibility rule editor with an optional advanced JSON mode. Server re-validates everything. */
export function RuleBuilder({ meta, value, onChange }: { meta: Meta; value: RuleGroup; onChange: (g: RuleGroup) => void }) {
  const [jsonMode, setJsonMode] = useState(false);
  const [json, setJson] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          className="btn-ghost btn-sm"
          aria-pressed={jsonMode}
          onClick={() => {
            if (!jsonMode) setJson(JSON.stringify(value, null, 2));
            setJsonError(null);
            setJsonMode((m) => !m);
          }}
        >
          <Braces className="h-4 w-4" aria-hidden /> {jsonMode ? 'Back to visual editor' : 'Advanced: edit as JSON'}
        </button>
      </div>
      {jsonMode ? (
        <div>
          <label htmlFor="rules-json" className="label">Rules JSON</label>
          <textarea id="rules-json" rows={14} className="input font-mono text-xs" value={json} onChange={(e) => setJson(e.target.value)} aria-invalid={Boolean(jsonError)} />
          {jsonError && <p className="field-error" role="alert">{jsonError}</p>}
          <button
            type="button"
            className="btn-secondary btn-sm mt-2"
            onClick={() => {
              try {
                const parsed = JSON.parse(json);
                if (!parsed || typeof parsed !== 'object' || !('op' in parsed) || !Array.isArray(parsed.conditions)) throw new Error('Root must be { "op": "all" | "any", "conditions": [...] }');
                onChange(parsed);
                setJsonError(null);
                setJsonMode(false);
              } catch (e) {
                setJsonError((e as Error).message);
              }
            }}
          >
            Apply JSON
          </button>
          <p className="help">The server validates fields, operators and values when you save.</p>
        </div>
      ) : (
        <GroupEditor meta={meta} group={value} onChange={onChange} depth={1} path="rule" />
      )}
    </div>
  );
}
