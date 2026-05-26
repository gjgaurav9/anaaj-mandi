import Link from 'next/link';

export function SiteNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-wheat-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-wheat-500 font-bold text-white">
            अ
          </span>
          <div className="leading-tight">
            <div className="font-semibold tracking-tight">Anaaj Mandi</div>
            <div className="text-xs text-neutral-500">Indore wheat marketplace</div>
          </div>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/browse"
            className="rounded-md px-3 py-1.5 text-neutral-700 hover:bg-wheat-50"
          >
            Browse
          </Link>
          <Link
            href="/login"
            className="rounded-md bg-wheat-500 px-3 py-1.5 font-medium text-white hover:bg-wheat-600"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-wheat-100 bg-wheat-50 py-6">
      <div className="mx-auto max-w-6xl px-4 text-sm text-neutral-600">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Anaaj Mandi · Indore, MP</span>
          <span className="text-neutral-500">
            v0.1 · Phone OTP login · WhatsApp pe connect karo
          </span>
        </div>
      </div>
    </footer>
  );
}
