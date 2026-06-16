'use client';

import { useT } from '@/lib/i18n';

export function HelpHeader() {
  const t = useT();
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{t('help.title')}</h1>
      <p className="mt-1 text-neutral-600">{t('help.intro')}</p>
    </div>
  );
}
