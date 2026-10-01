import React from 'react';
import { Info } from 'lucide-react';
import { KIND_LABEL, KIND_DESCRIPTION, type DataKind } from '@/data/sources';
import { formatCompact, formatNaira } from '@/lib/engine/money';

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

export const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={cx('rounded-xl border border-slate-200 bg-white', className)}>{children}</div>
);

export const SectionHeading: React.FC<{ eyebrow?: string; title: string; blurb?: string; center?: boolean }> = ({
  eyebrow,
  title,
  blurb,
  center,
}) => (
  <div className={cx('max-w-3xl', center && 'mx-auto text-center')}>
    {eyebrow && (
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">{eyebrow}</p>
    )}
    <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
    {blurb && <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{blurb}</p>}
  </div>
);

const KIND_STYLES: Record<DataKind, string> = {
  verified: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  derived: 'bg-sky-50 text-sky-800 border-sky-200',
  estimated: 'bg-amber-50 text-amber-800 border-amber-200',
  user: 'bg-slate-100 text-slate-700 border-slate-300',
};

export const KindBadge: React.FC<{ kind: DataKind; className?: string }> = ({ kind, className }) => (
  <span
    title={KIND_DESCRIPTION[kind]}
    className={cx(
      'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
      KIND_STYLES[kind],
      className,
    )}
  >
    {KIND_LABEL[kind]}
  </span>
);

export const StatCard: React.FC<{
  label: string;
  low: number;
  high: number;
  point?: number;
  note?: string;
  accent?: 'default' | 'positive' | 'warning' | 'critical';
  onInspect?: () => void;
}> = ({ label, low, high, note, accent = 'default', onInspect }) => {
  const accents = {
    default: 'border-slate-200',
    positive: 'border-emerald-300',
    warning: 'border-amber-300',
    critical: 'border-rose-300',
  } as const;
  return (
    <div className={cx('rounded-xl border bg-white p-5 transition hover:shadow-sm', accents[accent])}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
        {onInspect && (
          <button
            type="button"
            onClick={onInspect}
            aria-label={`How ${label} was calculated`}
            className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <Info className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="mt-2 font-mono text-[22px] font-semibold tracking-tight text-slate-900 sm:text-2xl">
        {formatCompact(low)} <span className="text-slate-400">–</span> {formatCompact(high)}
      </p>
      {note && <p className="mt-2 text-xs leading-relaxed text-slate-500">{note}</p>}
    </div>
  );
};

export const Field: React.FC<{
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, hint, htmlFor, children, className }) => (
  <div className={cx('space-y-1.5', className)}>
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-800">
      {label}
    </label>
    {children}
    {hint && <p className="text-xs leading-relaxed text-slate-500">{hint}</p>}
  </div>
);

export const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[15px] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30';

export const NumberInput: React.FC<{
  id?: string;
  value: number | null;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  placeholder?: string;
  ariaLabel?: string;
}> = ({ id, value, onChange, min = 0, max = 1_000_000_000, step = 1, prefix = '₦', placeholder, ariaLabel }) => (
  <div className="relative">
    {prefix && (
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
        {prefix}
      </span>
    )}
    <input
      id={id}
      type="number"
      inputMode="numeric"
      aria-label={ariaLabel}
      className={cx(inputClass, prefix && 'pl-7', 'font-mono')}
      value={value === null || Number.isNaN(value) ? '' : value}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      onChange={(e) => {
        const raw = Number(e.target.value);
        if (e.target.value === '') return onChange(0);
        if (!Number.isFinite(raw)) return;
        onChange(Math.min(max, Math.max(min, raw)));
      }}
    />
  </div>
);

export const OptionGrid = ({
  options,
  value,
  onChange,
  columns = 2,
  name,
}: {
  options: { id: string; label: string; description?: string; disabled?: boolean }[];
  value: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (v: any) => void;
  columns?: 1 | 2 | 3 | 4;
  name: string;
}) => (

  <div
    role="radiogroup"
    aria-label={name}
    className={cx(
      'grid gap-2.5',
      columns === 1 && 'grid-cols-1',
      columns === 2 && 'grid-cols-1 sm:grid-cols-2',
      columns === 3 && 'grid-cols-1 sm:grid-cols-3',
      columns === 4 && 'grid-cols-2 sm:grid-cols-4',
    )}
  >
    {options.map((o) => {
      const active = o.id === value;
      return (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={active}
          disabled={o.disabled}
          onClick={() => !o.disabled && onChange(o.id)}
          className={cx(
            'rounded-lg border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
            o.disabled && 'cursor-not-allowed opacity-40',
            active
              ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
              : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50',
          )}
        >
          <span className={cx('block text-sm font-medium', active ? 'text-emerald-900' : 'text-slate-800')}>
            {o.label}
          </span>
          {o.description && <span className="mt-1 block text-xs leading-relaxed text-slate-500">{o.description}</span>}
        </button>
      );
    })}
  </div>
);

export const Slider: React.FC<{
  id?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  label: string;
}> = ({ id, min, max, step = 1, value, onChange, format, label }) => (
  <div>
    <div className="flex items-baseline justify-between">
      <label htmlFor={id} className="text-sm font-medium text-slate-800">
        {label}
      </label>
      <span className="font-mono text-sm font-semibold text-emerald-800">
        {format ? format(value) : value}
      </span>
    </div>
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-emerald-600"
    />
  </div>
);

export const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }> = ({
  checked,
  onChange,
  label,
  hint,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="flex w-full items-start gap-3 rounded-lg border border-slate-300 bg-white p-3 text-left transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
  >
    <span
      className={cx(
        'mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition',
        checked ? 'bg-emerald-600' : 'bg-slate-300',
      )}
    >
      <span className={cx('h-4 w-4 rounded-full bg-white transition', checked && 'translate-x-4')} />
    </span>
    <span>
      <span className="block text-sm font-medium text-slate-800">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>}
    </span>
  </button>
);

export const Money: React.FC<{ value: number; compact?: boolean; className?: string }> = ({
  value,
  compact,
  className,
}) => (
  <span className={cx('font-mono tabular-nums', className)}>
    {compact ? formatCompact(value) : formatNaira(value)}
  </span>
);

export const Callout: React.FC<{
  tone?: 'info' | 'warning' | 'positive';
  title?: string;
  children: React.ReactNode;
}> = ({ tone = 'info', title, children }) => {
  const tones = {
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    positive: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  } as const;
  return (
    <div className={cx('rounded-lg border p-4 text-sm leading-relaxed', tones[tone])}>
      {title && <p className="mb-1 font-semibold">{title}</p>}
      {children}
    </div>
  );
};

export const Bar: React.FC<{ value: number; tone?: string }> = ({ value, tone = 'bg-emerald-600' }) => (
  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
    <div className={cx('h-full rounded-full transition-all duration-500', tone)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
);
