import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Anaaj Mandi — Indore grain marketplace',
  description: 'Brokers list, buyers connect — Indore ka grain trade WhatsApp pe.',
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
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
