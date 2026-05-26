import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from './cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'whatsapp';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: 'bg-wheat-500 text-white hover:bg-wheat-600',
  secondary: 'bg-white text-wheat-600 border border-wheat-400 hover:bg-wheat-50',
  ghost: 'text-neutral-700 hover:bg-neutral-100',
  whatsapp: 'bg-emerald-500 text-white hover:bg-emerald-600',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-wheat-400 focus:ring-offset-2',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    />
  );
});
