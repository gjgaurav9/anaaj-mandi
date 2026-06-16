'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { LOCALE_COOKIE, translate, type Locale } from './dictionaries';

// Re-export the server-safe pieces for client consumers' convenience.
// NOTE: Server Components must import asLocale/LOCALE_COOKIE/translate from
// './dictionaries' directly — importing them through this 'use client' module
// turns them into client references (TypeError: c is not a function).
export {
  LOCALES,
  LOCALE_LABELS,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  asLocale,
  translate,
  type Locale,
} from './dictionaries';

interface I18nValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    // Persist for SSR on the next request. 1-year cookie, lax is fine.
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  );

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within <I18nProvider>');
  return ctx;
}

/** Convenience hook returning just the translate function. */
export function useT() {
  return useI18n().t;
}
