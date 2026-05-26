import type { ReactNode } from 'react';
import { MobileHeader } from '@/components/MobileHeader';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <MobileHeader />
      <main className="flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
