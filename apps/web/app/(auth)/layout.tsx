import Link from 'next/link';
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-wheat-50">
      <header className="border-b border-wheat-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-wheat-500 font-bold text-white">
              अ
            </span>
            <span className="font-semibold tracking-tight">Anaaj Mandi</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto flex max-w-md flex-col px-4 py-10">{children}</main>
    </div>
  );
}
