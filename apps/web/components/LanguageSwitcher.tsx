'use client';

import { useRouter } from 'next/navigation';
import { LOCALES, LOCALE_LABELS, useI18n, type Locale } from '@/lib/i18n';

/**
 * Compact language picker. Updates the in-memory locale immediately (client
 * components re-render via context) and refreshes the route so server
 * components pick up the new cookie too.
 */
export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  const router = useRouter();

  return (
    <label className={`relative inline-flex items-center ${className}`}>
      <span className="sr-only">{t('common.language')}</span>
      <span aria-hidden className="pointer-events-none absolute left-2 text-xs">
        🌐
      </span>
      <select
        value={locale}
        onChange={(e) => {
          setLocale(e.target.value as Locale);
          router.refresh();
        }}
        className="appearance-none rounded-full border border-neutral-300 bg-white py-1 pl-7 pr-6 text-xs font-medium text-neutral-700 shadow-sm focus:border-wheat-500 focus:outline-none focus:ring-1 focus:ring-wheat-500"
        aria-label="Select language"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_LABELS[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
