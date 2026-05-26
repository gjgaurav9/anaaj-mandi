import type { ReactNode } from 'react';
import { SiteFooter, SiteNav } from '@/components/SiteNav';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />
      <main className="flex-1 bg-wheat-50">{children}</main>
      <SiteFooter />
    </div>
  );
}
