import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000';

// Same-origin reverse proxy: browser -> /api/* on :3000 -> Fastify on :4000.
// Keeps the auth cookie on the web origin so server components can read it
// via cookies(), and avoids CORS in production where web + api share a host.
async function proxy(req: NextRequest, segments: string[]) {
  const subpath = segments.join('/');
  const target = new URL(`/${subpath}`, API_BASE);
  target.search = req.nextUrl.search;

  const reqHeaders = new Headers();
  const cookie = req.headers.get('cookie');
  if (cookie) reqHeaders.set('cookie', cookie);
  const contentType = req.headers.get('content-type');
  if (contentType) reqHeaders.set('content-type', contentType);

  const passThroughBody = !['GET', 'HEAD'].includes(req.method);
  const body = passThroughBody ? await req.text() : undefined;

  const apiRes = await fetch(target.toString(), {
    method: req.method,
    headers: reqHeaders,
    body,
    redirect: 'manual',
  });

  const respHeaders = new Headers();
  apiRes.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (k === 'set-cookie') return; // multi-cookie handled below
    if (k === 'content-encoding' || k === 'content-length' || k === 'transfer-encoding') return;
    respHeaders.append(key, value);
  });

  // Forward each Set-Cookie individually (Headers.forEach collapses them).
  const setCookies =
    typeof apiRes.headers.getSetCookie === 'function' ? apiRes.headers.getSetCookie() : [];
  for (const sc of setCookies) respHeaders.append('set-cookie', sc);

  return new NextResponse(apiRes.body, {
    status: apiRes.status,
    headers: respHeaders,
  });
}

type Ctx = { params: { path: string[] } };

export const GET = (req: NextRequest, ctx: Ctx) => proxy(req, ctx.params.path);
export const POST = (req: NextRequest, ctx: Ctx) => proxy(req, ctx.params.path);
export const PATCH = (req: NextRequest, ctx: Ctx) => proxy(req, ctx.params.path);
export const PUT = (req: NextRequest, ctx: Ctx) => proxy(req, ctx.params.path);
export const DELETE = (req: NextRequest, ctx: Ctx) => proxy(req, ctx.params.path);
