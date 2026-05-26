import type { ReactNode } from 'react';
import Link from 'next/link';
import { getMe } from '@/lib/me';
import { MobileHeader } from '@/components/MobileHeader';
import { BottomNav } from '@/components/BottomNav';
import { LogoutButton } from '@/components/LogoutButton';

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const me = await getMe();

  const right = me ? (
    <LogoutButton />
  ) : (
    <Link
      href="/login"
      className="rounded-full bg-wheat-500 px-3 py-1.5 text-xs font-semibold text-white"
    >
      Sign in
    </Link>
  );

  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <MobileHeader right={right} />
      <main className={`flex-1 ${me ? 'pb-16' : ''}`}>{children}</main>
      {me && <BottomNav role={me.role} />}
    </div>
  );
}
