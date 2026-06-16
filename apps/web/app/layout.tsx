import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { I18nProvider } from '@/lib/i18n';
import { LOCALE_COOKIE, asLocale } from '@/lib/i18n/dictionaries';
import './globals.css';

export const metadata: Metadata = {
  title: "Anaaj Mandi — India's grain marketplace",
  description: 'Brokers list, buyers connect — India bhar ka grain trade WhatsApp pe.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Anaaj Mandi',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#d4a017',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const locale = asLocale(cookies().get(LOCALE_COOKIE)?.value);
  return (
    <html lang={locale}>
      <body>
        <I18nProvider initialLocale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
