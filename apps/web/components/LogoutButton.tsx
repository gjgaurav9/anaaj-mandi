'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { clientFetch } from '@/lib/clientApi';

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await clientFetch('/auth/logout', { method: 'POST' });
    } catch {
      // already-signed-out is fine
    }
    router.push('/');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      className="rounded-md px-3 py-1.5 text-neutral-600 hover:bg-wheat-50"
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
