'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Role } from '@anaaj/types';
import { useT } from '@/lib/i18n';

interface Tab {
  href: string;
  labelKey: string;
  icon: string;
}

const TABS_BY_ROLE: Record<Role, Tab[]> = {
  broker: [
    { href: '/dashboard', labelKey: 'nav.home', icon: '🏠' },
    { href: '/lots/mine', labelKey: 'nav.listings', icon: '📋' },
    { href: '/lots/new', labelKey: 'nav.add', icon: '➕' },
    { href: '/inquiries', labelKey: 'nav.inquiries', icon: '💬' },
    { href: '/profile', labelKey: 'nav.profile', icon: '👤' },
  ],
  buyer: [
    { href: '/dashboard', labelKey: 'nav.home', icon: '🏠' },
    { href: '/browse', labelKey: 'nav.browse', icon: '🌾' },
    { href: '/inquiries', labelKey: 'nav.inquiries', icon: '💬' },
    { href: '/help', labelKey: 'nav.help', icon: '🆘' },
    { href: '/profile', labelKey: 'nav.profile', icon: '👤' },
  ],
  admin: [
    { href: '/dashboard', labelKey: 'nav.home', icon: '🏠' },
    { href: '/browse', labelKey: 'nav.browse', icon: '🌾' },
    { href: '/admin', labelKey: 'nav.admin', icon: '⚙️' },
    { href: '/profile', labelKey: 'nav.profile', icon: '👤' },
  ],
};

function isActive(currentPath: string, tabHref: string): boolean {
  if (tabHref === '/dashboard') return currentPath === tabHref;
  return currentPath === tabHref || currentPath.startsWith(`${tabHref}/`);
}

export function BottomNav({ role }: { role: Role }) {
  const path = usePathname();
  const t = useT();
  const tabs: Tab[] = TABS_BY_ROLE[role] ?? TABS_BY_ROLE.buyer;

  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className="sticky bottom-0 z-30 grid h-16 border-t border-neutral-200 bg-white md:hidden"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map((tab) => {
        const active = isActive(path, tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
              active ? 'text-wheat-600' : 'text-neutral-500'
            }`}
          >
            <span aria-hidden className="text-xl leading-none">
              {tab.icon}
            </span>
            <span>{t(tab.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
