import type { ReactNode } from 'react';
import { getMe } from '@/lib/me';
import { AppHeader } from '@/components/AppHeader';
import { BottomNav } from '@/components/BottomNav';

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const me = await getMe();

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader me={me} />
      {/* pb-16 reserves space for the mobile bottom nav (visible only when authed) */}
      <main className={`flex-1 ${me ? 'pb-16 md:pb-0' : ''}`}>{children}</main>
      {me && <BottomNav role={me.role} />}
    </div>
  );
}
