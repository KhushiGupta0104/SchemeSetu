import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import type { Option } from '@/types';

interface FieldProps {
  label: string;
  error?: string;
  help?: ReactNode;
  optional?: boolean;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}

/** Associates a label, help text and error message with a control for screen readers. */
export function Field({ label, error, help, optional, children }: FieldProps) {
  const id = useId();
  const helpId = `${id}-help`;
  const errId = `${id}-err`;
  const describedBy = [help ? helpId : '', error ? errId : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div>
      <label htmlFor={id} className="label">
        {label} {optional && <span className="font-normal text-ink-muted">(optional)</span>}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {help && !error && (
        <p id={helpId} className="help">
          {help}
        </p>
      )}
      {error && (
        <p id={errId} className="field-error" role="alert">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden /> {error}
        </p>
      )}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; help?: ReactNode; optional?: boolean };

export const TextField = forwardRef<HTMLInputElement, InputProps>(function TextField({ label, error, help, optional, ...rest }, ref) {
  return (
    <Field label={label} error={error} help={help} optional={optional}>
      {({ id, describedBy, invalid }) => (
        <input ref={ref} id={id} aria-describedby={describedBy} aria-invalid={invalid} className="input" {...rest} />
      )}
    </Field>
  );
});

export const PasswordField = forwardRef<HTMLInputElement, InputProps>(function PasswordField({ label, error, help, ...rest }, ref) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} error={error} help={help}>
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={show ? 'text' : 'password'}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            className="input pr-12"
            {...rest}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-ink-muted hover:text-ink"
            aria-label={show ? 'Hide password' : 'Show password'}
            aria-pressed={show}
          >
            {show ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      )}
    </Field>
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  help?: ReactNode;
  optional?: boolean;
  options: Option[];
  placeholder?: string;
};

export const SelectField = forwardRef<HTMLSelectElement, SelectProps>(function SelectField(
  { label, error, help, optional, options, placeholder = 'Select…', ...rest },
  ref,
) {
  return (
    <Field label={label} error={error} help={help} optional={optional}>
      {({ id, describedBy, invalid }) => (
        <select ref={ref} id={id} aria-describedby={describedBy} aria-invalid={invalid} className="input pr-9" {...rest}>
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
});

/** Large, touch-friendly radio cards for short option lists. */
export function RadioCards({
  name,
  options,
  value,
  onChange,
  legend,
  help,
  columns = 2,
}: {
  name: string;
  options: Option[];
  value: string | undefined;
  onChange: (v: string) => void;
  legend: string;
  help?: string;
  columns?: 2 | 3;
}) {
  return (
    <fieldset>
      <legend className="label">
        {legend} <span className="font-normal text-ink-muted">(optional)</span>
      </legend>
      {help && <p className="help -mt-1 mb-2">{help}</p>}
      <div className={`grid gap-2 ${columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              className={`flex min-h-[2.75rem] cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2 text-sm transition ${
                checked ? 'border-brand-600 bg-brand-50 font-semibold text-brand-800 ring-2 ring-brand-100' : 'border-line bg-white hover:border-brand-300'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="h-4 w-4 accent-brand-600"
              />
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
