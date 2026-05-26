'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Role } from '@anaaj/types';

interface Tab {
  href: string;
  label: string;
  icon: string;
}

const TABS_BY_ROLE: Record<Role, Tab[]> = {
  broker: [
    { href: '/dashboard', label: 'Home', icon: '🏠' },
    { href: '/lots/mine', label: 'Listings', icon: '📋' },
    { href: '/lots/new', label: 'Add', icon: '➕' },
    { href: '/inquiries', label: 'Inquiries', icon: '💬' },
    { href: '/profile', label: 'Profile', icon: '👤' },
  ],
  buyer: [
    { href: '/dashboard', label: 'Home', icon: '🏠' },
    { href: '/browse', label: 'Browse', icon: '🌾' },
    { href: '/inquiries', label: 'Inquiries', icon: '💬' },
    { href: '/profile', label: 'Profile', icon: '👤' },
  ],
  admin: [
    { href: '/dashboard', label: 'Home', icon: '🏠' },
    { href: '/browse', label: 'Browse', icon: '🌾' },
    { href: '/admin', label: 'Admin', icon: '⚙️' },
    { href: '/profile', label: 'Profile', icon: '👤' },
  ],
};

function isActive(currentPath: string, tabHref: string): boolean {
  if (tabHref === '/dashboard') return currentPath === tabHref;
  return currentPath === tabHref || currentPath.startsWith(`${tabHref}/`);
}

export function BottomNav({ role }: { role: Role }) {
  const path = usePathname();
  const tabs: Tab[] = TABS_BY_ROLE[role] ?? TABS_BY_ROLE.buyer;

  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className="sticky bottom-0 z-30 grid h-16 grid-cols-[repeat(auto-fit,minmax(0,1fr))] border-t border-neutral-200 bg-white"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map((t) => {
        const active = isActive(path, t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
              active ? 'text-wheat-600' : 'text-neutral-500'
            }`}
          >
            <span aria-hidden className="text-xl leading-none">
              {t.icon}
            </span>
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
