'use client';

/** Read-only star display for an average rating (supports halves). */
export function Stars({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const cls = size === 'md' ? 'text-lg' : 'text-sm';
  return (
    <span className={`inline-flex items-center ${cls} leading-none text-amber-500`} aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < full) return <span key={i}>★</span>;
        if (i === full && half) return <span key={i}>⯨</span>;
        return (
          <span key={i} className="text-neutral-300">
            ★
          </span>
        );
      })}
    </span>
  );
}

/** Interactive 1–5 star input. */
export function StarInput({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label?: string;
}) {
  return (
    <span className="inline-flex items-center gap-0.5" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onClick={() => onChange(n)}
          className={`text-2xl leading-none transition ${
            n <= value ? 'text-amber-500' : 'text-neutral-300 hover:text-amber-300'
          }`}
        >
          ★
        </button>
      ))}
    </span>
  );
}
