'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

interface PhoneInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value'
> {
  value: string; // 10-digit string (no +91)
  onChange: (digits: string) => void;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput(
  { value, onChange, className = '', ...rest },
  ref,
) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-700">Mobile number</span>
      <div className="flex overflow-hidden rounded-md border border-neutral-300 bg-white shadow-sm focus-within:border-wheat-500 focus-within:ring-1 focus-within:ring-wheat-500">
        <span className="border-r border-neutral-200 bg-wheat-50 px-3 py-2 text-sm text-neutral-700">
          +91
        </span>
        <input
          ref={ref}
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={10}
          placeholder="98765 43210"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
          className={`flex-1 bg-transparent px-3 py-2 text-sm outline-none ${className}`}
          {...rest}
        />
      </div>
    </label>
  );
});
