'use client';

import {
  useEffect,
  useRef,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react';

interface OTPInputProps {
  value: string; // 0–6 digits
  onChange: (otp: string) => void;
  autoFocus?: boolean;
}

const LENGTH = 6;

export function OTPInput({ value, onChange, autoFocus }: OTPInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? '');

  function setAt(i: number, ch: string) {
    const next = digits.slice();
    next[i] = ch;
    onChange(next.join('').replace(/[^\d]/g, '').slice(0, LENGTH));
  }

  function handleChange(i: number, e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setAt(i, '');
      return;
    }
    if (raw.length > 1) {
      // user typed several digits (e.g. paste-into-single-box) — spread across
      const combined = (value + raw).replace(/\D/g, '').slice(0, LENGTH);
      onChange(combined);
      const focusIndex = Math.min(combined.length, LENGTH - 1);
      refs.current[focusIndex]?.focus();
      return;
    }
    setAt(i, raw);
    if (i < LENGTH - 1) refs.current[i + 1]?.focus();
  }

  function handleKey(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < LENGTH - 1) {
      refs.current[i + 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH);
    if (!text) return;
    e.preventDefault();
    onChange(text);
    refs.current[Math.min(text.length, LENGTH - 1)]?.focus();
  }

  return (
    <div className="flex gap-2" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          className="h-12 w-10 rounded-md border border-neutral-300 bg-white text-center text-lg font-semibold shadow-sm focus:border-wheat-500 focus:outline-none focus:ring-1 focus:ring-wheat-500"
          aria-label={`OTP digit ${i + 1}`}
        />
      ))}
    </div>
  );
}
