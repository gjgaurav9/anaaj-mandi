/**
 * Browser-side API client. Hits the same-origin /api proxy so the auth cookie
 * lives on the web host and Next can read it from server components.
 */
export interface ApiOk<T> {
  ok: true;
  data: T;
}
export interface ApiErr {
  ok: false;
  error: { code: string; message: string; details?: unknown };
}

export class ClientApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ClientApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function clientFetch<T>(
  path: string,
  opts: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`/api${path.startsWith('/') ? path : `/${path}`}`, {
    method: opts.method ?? 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    credentials: 'same-origin',
  });
  const json = (await res.json()) as ApiOk<T> | ApiErr;
  if (!json.ok) {
    throw new ClientApiError(res.status, json.error.code, json.error.message, json.error.details);
  }
  return json.data;
}
