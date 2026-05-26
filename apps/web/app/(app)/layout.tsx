import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getMe } from '@/lib/me';
import { AppHeader } from '@/components/AppHeader';
import { BottomNav } from '@/components/BottomNav';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const me = await getMe();
  if (!me) redirect('/login');

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader me={me} />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <BottomNav role={me.role} />
    </div>
  );
}
