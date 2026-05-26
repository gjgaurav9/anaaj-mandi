import Link from 'next/link';

interface MobileHeaderProps {
  /** Optional left slot — typically a back chevron link. */
  left?: React.ReactNode;
  /** Optional right slot — small action (Sign in / icon). */
  right?: React.ReactNode;
  /** Page title; falls back to "Anaaj Mandi" with the अ chip. */
  title?: string;
}

export function MobileHeader({ left, right, title }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-neutral-200 bg-white/90 px-3 backdrop-blur">
      <div className="flex min-w-[3rem] items-center">{left}</div>
      <Link
        href="/"
        className="flex items-center gap-2 text-base font-semibold tracking-tight text-neutral-900"
      >
        {title ? (
          <span>{title}</span>
        ) : (
          <>
            <span className="grid h-7 w-7 place-items-center rounded-md bg-wheat-500 text-sm font-bold text-white">
              अ
            </span>
            <span>Anaaj Mandi</span>
          </>
        )}
      </Link>
      <div className="flex min-w-[3rem] items-center justify-end">{right}</div>
    </header>
  );
}

export function BackLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      aria-label="Back"
      className="grid h-9 w-9 place-items-center rounded-full text-neutral-700 hover:bg-neutral-100"
    >
      <span aria-hidden className="text-xl">
        ←
      </span>
    </Link>
  );
}
