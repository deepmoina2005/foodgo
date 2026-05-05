import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import clsx from 'clsx';
import { MoonStar, SunMedium } from 'lucide-react';

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  children: ReactNode;
}) {
  const variants = {
    primary: 'bg-[var(--app-brand)] text-white hover:opacity-95 shadow-sm shadow-brand-500/20',
    secondary: 'bg-[var(--app-surface-strong)] text-[var(--app-text)] border border-[color:var(--app-border-strong)] hover:bg-[var(--app-surface-soft)]',
    ghost: 'bg-[var(--app-surface)] text-[var(--app-text)] border border-[color:var(--app-border)] hover:bg-[var(--app-hover)]',
    danger: 'bg-rose-500 text-white hover:bg-rose-600',
    success: 'bg-emerald-500 text-white hover:bg-emerald-600',
  };

  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-[var(--app-surface-strong)] disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  className = '',
  label,
  helperText,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; helperText?: string; error?: string }) {
  return (
    <label className="block space-y-2">
      {label ? <span className="text-sm font-medium text-[var(--app-muted)]">{label}</span> : null}
      <input
        className={clsx(
          'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100',
          error ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : '',
          className,
        )}
        {...props}
      />
      {helperText ? <p className="text-xs text-[var(--app-muted)]">{helperText}</p> : null}
      {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
    </label>
  );
}

export function Select({
  className = '',
  label,
  helperText,
  error,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; helperText?: string; error?: string }) {
  return (
    <label className="block space-y-2">
      {label ? <span className="text-sm font-medium text-[var(--app-muted)]">{label}</span> : null}
      <select
        className={clsx(
          'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100',
          error ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : '',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {helperText ? <p className="text-xs text-[var(--app-muted)]">{helperText}</p> : null}
      {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
    </label>
  );
}

export function Textarea({
  className = '',
  label,
  helperText,
  error,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; helperText?: string; error?: string }) {
  return (
    <label className="block space-y-2">
      {label ? <span className="text-sm font-medium text-[var(--app-muted)]">{label}</span> : null}
      <textarea
        className={clsx(
          'min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100',
          error ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : '',
          className,
        )}
        {...props}
      />
      {helperText ? <p className="text-xs text-[var(--app-muted)]">{helperText}</p> : null}
      {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
    </label>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx(
      'rounded-3xl border border-[color:var(--app-border)] bg-[var(--app-surface)] p-6 text-[var(--app-text)] shadow-sm transition-all duration-300 hover:shadow-md dark:border-white/5',
      className
    )}>
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = 'slate',
}: {
  children: ReactNode;
  tone?: 'slate' | 'gray' | 'green' | 'yellow' | 'red' | 'orange' | 'blue' | 'purple' | 'indigo' | 'cyan' | 'rose';
}) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-emerald-100 text-emerald-700',
    yellow: 'bg-amber-100 text-amber-700',
    red: 'bg-rose-100 text-rose-700',
    orange: 'bg-orange-100 text-orange-700',
    blue: 'bg-sky-100 text-sky-700',
    purple: 'bg-violet-100 text-violet-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    cyan: 'bg-cyan-100 text-cyan-700',
    rose: 'bg-rose-100 text-rose-700',
  };

  return <span className={clsx('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize', tones[tone])}>{children}</span>;
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  action,
  centered = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  centered?: boolean;
}) {
  return (
    <div className={clsx(
      'mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between',
      centered && 'text-center md:items-center md:justify-center'
    )}>
      <div className={clsx('max-w-3xl', centered && 'mx-auto')}>
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.4em] text-brand-600 mb-2">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-3xl font-black tracking-tight text-[var(--app-text)] md:text-5xl lg:text-6xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-4 text-sm leading-relaxed text-[var(--app-muted)] md:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className={clsx('flex flex-wrap items-center gap-2', centered && 'justify-center')}>
          {action}
        </div>
      ) : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-[var(--app-muted)]">{label}</p>
        <p className="mt-2 text-3xl font-black tracking-tight text-[var(--app-text)]">{value}</p>
        {hint ? <p className="mt-2 text-xs text-[var(--app-muted)]">{hint}</p> : null}
      </div>
      {icon ? <div className="rounded-2xl bg-[color:var(--app-hover)] p-3 text-[var(--app-brand)]">{icon}</div> : null}
    </Card>
  );
}

export function ThemeToggleButton({
  theme,
  onToggle,
  className = '',
}: {
  theme: 'light' | 'dark';
  onToggle: () => void;
  className?: string;
}) {
  return (
    <Button variant="ghost" type="button" onClick={onToggle} className={clsx('gap-2 whitespace-nowrap', className)}>
      {theme === 'dark' ? <SunMedium size={16} /> : <MoonStar size={16} />}
      <span className="hidden sm:inline">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
    </Button>
  );
}

export function LoadingSpinner({ className = '' }: { className?: string }) {
  return <span className={clsx('inline-flex h-5 w-5 animate-spin rounded-full border-2 border-[color:var(--app-border-strong)] border-t-[color:var(--app-brand)]', className)} />;
}

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <Card className="flex items-center justify-center gap-3 py-10 text-[var(--app-muted)]">
      <LoadingSpinner />
      <span className="text-sm font-medium">{label}</span>
    </Card>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <Card className={clsx('animate-pulse space-y-4', className)}>
      <div className="h-4 w-24 rounded-full bg-slate-100 dark:bg-slate-700" />
      <div className="h-8 w-3/4 rounded-2xl bg-slate-100 dark:bg-slate-700" />
      <div className="h-4 w-full rounded-full bg-slate-100 dark:bg-slate-700" />
      <div className="h-4 w-5/6 rounded-full bg-slate-100 dark:bg-slate-700" />
    </Card>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this section right now.',
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="border-rose-200 bg-rose-50/70 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-rose-700 dark:text-rose-200">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[color:var(--app-border)] bg-[var(--app-surface-soft)] px-6 py-10 text-center">
      <h3 className="text-lg font-bold text-[var(--app-text)]">{title}</h3>
      {description ? <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[var(--app-muted)]">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Table({
  columns,
  rows,
  emptyLabel = 'No records found.',
}: {
  columns: string[];
  rows: ReactNode[][];
  emptyLabel?: string;
}) {
  if (!rows.length) return <EmptyState title={emptyLabel} />;

  return (
    <div className="overflow-hidden rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface)] shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
          <thead className="bg-[var(--app-surface-soft)]">
            <tr>
              {columns.map((column) => (
                <th key={column} className="whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.2em] text-[var(--app-muted)]">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-[var(--app-surface)] dark:divide-slate-700">
            {rows.map((row, index) => (
              <tr key={index} className="transition hover:bg-[var(--app-hover)]">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-4 align-top text-[var(--app-text)]">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Modal({
  open,
  title,
  description,
  children,
  onClose,
  footer,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl" onClick={(event) => event.stopPropagation()}>
        <Card className="max-h-[90vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-[var(--app-text)]">{title}</h3>
              {description ? <p className="mt-1 text-sm text-[var(--app-muted)]">{description}</p> : null}
            </div>
            <Button variant="ghost" type="button" onClick={onClose}>Close</Button>
          </div>
          <div className="mt-6">{children}</div>
          {footer ? <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div> : null}
        </Card>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>{cancelLabel}</Button>
          <Button variant={confirmVariant} type="button" onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="text-sm text-[var(--app-muted)]">{description}</p>
    </Modal>
  );
}

export function SearchFilterBar({
  query,
  onQueryChange,
  placeholder = 'Search...',
  action,
  children,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder?: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Card className="mb-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={placeholder}
            className="w-full rounded-2xl border border-[color:var(--app-border)] bg-[var(--app-surface-strong)] px-4 py-3 text-sm text-[var(--app-text)] outline-none transition placeholder:text-[var(--app-muted)] focus:border-brand-400 focus:ring-4 focus:ring-brand-100 md:max-w-md"
          />
          {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
        </div>
        {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
      </div>
    </Card>
  );
}

export { Table as DataTable };
