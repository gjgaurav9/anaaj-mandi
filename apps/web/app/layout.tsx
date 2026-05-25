import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Anaaj Mandi — Indore wheat marketplace',
  description: 'Connect Indore wheat sellers, brokers, and buyers directly via WhatsApp.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
