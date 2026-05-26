import type { ReactNode } from 'react';
import { SiteFooter, SiteNav } from '@/components/SiteNav';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
