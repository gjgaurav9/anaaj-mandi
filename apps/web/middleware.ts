import { NextResponse, type NextRequest } from 'next/server';

const COOKIE_NAME = process.env.JWT_COOKIE_NAME ?? 'am_session';

// Routes that require any authenticated user.
const AUTHED_PATHS = [
  '/dashboard',
  '/onboarding',
  '/lots/new',
  '/lots/mine',
  '/inquiries',
  '/profile',
];

// Admin-only prefix. Role enforcement happens server-side in the route handler;
// middleware just stops anonymous users at the door.
const ADMIN_PREFIX = '/admin';

function isProtected(path: string): boolean {
  if (path.startsWith(ADMIN_PREFIX)) return true;
  return AUTHED_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (!isProtected(path)) return NextResponse.next();
  const cookie = req.cookies.get(COOKIE_NAME);
  if (cookie?.value) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('next', path);
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals, the api proxy, and static files.
  matcher: ['/((?!_next/|api/|.*\\..*).*)'],
};
