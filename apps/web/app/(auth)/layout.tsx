import type { ReactNode } from 'react';
import { AppHeader } from '@/components/AppHeader';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader me={null} />
      {/* Forms always render in a centered, narrow column regardless of screen. */}
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6 md:py-12">
        {children}
      </main>
    </div>
  );
}
