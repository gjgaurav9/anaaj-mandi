'use client';

import Link from 'next/link';
import type { MeUser } from '@/lib/me';
import { useT } from '@/lib/i18n';
import { LogoutButton } from './LogoutButton';
import { LanguageSwitcher } from './LanguageSwitcher';

interface AppHeaderProps {
  me: MeUser | null;
}

// Responsive header:
//   - mobile (< md): compact logo on the left, language + primary action on the right
//   - desktop (>= md): logo + inline nav links + user identity + auth action
export function AppHeader({ me }: AppHeaderProps) {
  const t = useT();

  const navLinks: Array<{ href: string; key: string; showWhen: 'always' | 'authed' }> = [
    { href: '/browse', key: 'nav.browse', showWhen: 'always' },
    { href: '/dashboard', key: 'nav.dashboard', showWhen: 'authed' },
    { href: '/lots/mine', key: 'nav.listings', showWhen: 'authed' },
    { href: '/inquiries', key: 'nav.inquiries', showWhen: 'authed' },
    { href: '/help', key: 'nav.help', showWhen: 'always' },
  ];

  const visibleLinks = navLinks.filter(
    (l) => l.showWhen === 'always' || (l.showWhen === 'authed' && me),
  );

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 md:h-16">
        <Link href="/" className="flex items-center gap-2 text-base font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-wheat-500 text-sm font-bold text-white">
            अ
          </span>
          <span className="leading-tight">
            <span className="block">Anaaj Mandi</span>
            <span className="hidden text-[11px] font-normal text-neutral-500 md:block">
              {t('header.tagline')}
            </span>
          </span>
        </Link>

        {/* Desktop nav links — hidden on mobile (where bottom nav handles this) */}
        <nav className="hidden flex-1 items-center justify-center gap-1 text-sm md:flex">
          {visibleLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1.5 text-neutral-700 hover:bg-wheat-50"
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {me ? (
            <>
              <span className="hidden text-xs text-neutral-500 lg:inline">
                {me.name ?? me.phone} · <span className="capitalize">{me.role}</span>
              </span>
              <LogoutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-wheat-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-wheat-600 md:text-sm"
            >
              {t('header.signIn')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
