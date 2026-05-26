import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getMe } from '@/lib/me';
import { MobileHeader } from '@/components/MobileHeader';
import { BottomNav } from '@/components/BottomNav';
import { LogoutButton } from '@/components/LogoutButton';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const me = await getMe();
  if (!me) redirect('/login');

  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <MobileHeader right={<LogoutButton />} />
      <main className="flex-1 pb-16">{children}</main>
      <BottomNav role={me.role} />
    </div>
  );
}
