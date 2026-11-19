import { Minus, Plus } from 'lucide-react';

export function QtyStepper({ value, max, onChange, label, size = 'md' }: { value: number; max: number; onChange: (v: number) => void; label: string; size?: 'sm' | 'md' }) {
  const h = size === 'sm' ? 'h-9' : 'h-11';
  const w = size === 'sm' ? 'w-9' : 'w-11';
  return (
    <div className={`inline-flex items-center rounded-control border border-rule-strong bg-surface ${h}`} role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="One fewer" className={`grid ${h} ${w} place-items-center rounded-l-control text-ink-muted hover:bg-sunken hover:text-ink disabled:opacity-35`}>
        <Minus size={16} />
      </button>
      <span className="tabular min-w-8 text-center font-semibold" aria-live="polite">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="One more" className={`grid ${h} ${w} place-items-center rounded-r-control text-ink-muted hover:bg-sunken hover:text-ink disabled:opacity-35`}>
        <Plus size={16} />
      </button>
    </div>
  );
}
