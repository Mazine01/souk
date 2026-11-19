import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';

const control =
  'w-full rounded-control border bg-surface px-3 text-base text-ink placeholder:text-ink-muted/70 transition-colors ' +
  'hover:border-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25 ' +
  'disabled:bg-sunken disabled:text-ink-muted sm:text-sm';

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

function FieldShell({ id, label, hint, error, children, className = '' }: FieldShellProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, wrapperClassName, className = '', id, ...rest },
  ref,
) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} className={wrapperClassName}>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={`${control} h-10 ${error ? 'border-danger' : 'border-rule-strong'} ${className}`}
        {...rest}
      />
    </FieldShell>
  );
});

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
};

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, hint, error, wrapperClassName, className = '', id, children, ...rest },
  ref,
) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} className={wrapperClassName}>
      <select
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={`${control} h-10 appearance-none bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-9 ${error ? 'border-danger' : 'border-rule-strong'} ${className}`}
        style={{ backgroundImage: CHEVRON }}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
});

/** Compact select for toolbars: the label is visually hidden but still read by screen readers. */
export function FilterSelect({
  label,
  className = '',
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        className={`${control} h-10 w-full appearance-none border-rule-strong bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-9`}
        style={{ backgroundImage: CHEVRON }}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
}

const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23626B68' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";
