import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export function Card({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardBody({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={cn('p-4', className)} {...rest}>
      {children}
    </div>
  );
}

export function Badge({
  className,
  children,
  tone = 'neutral',
}: {
  className?: string;
  children: ReactNode;
  tone?: 'neutral' | 'wheat' | 'success' | 'warn';
}) {
  const tones: Record<typeof tone, string> = {
    neutral: 'bg-neutral-100 text-neutral-700',
    wheat: 'bg-wheat-100 text-wheat-600',
    success: 'bg-emerald-50 text-emerald-700',
    warn: 'bg-amber-50 text-amber-700',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
