const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000';

export interface ApiOk<T> {
  ok: true;
  data: T;
}
export interface ApiErr {
  ok: false;
  error: { code: string; message: string; details?: unknown };
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

/**
 * Server-side API fetch. Pass `cookie` from `cookies()` when calling from
 * an authed server component so the JWT is forwarded to Fastify.
 */
export async function apiFetch<T>(
  path: string,
  opts: {
    method?: string;
    body?: unknown;
    cookie?: string;
    cache?: RequestCache;
    revalidate?: number;
  } = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.cookie ? { cookie: opts.cookie } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: opts.cache,
    next: opts.revalidate !== undefined ? { revalidate: opts.revalidate } : undefined,
  });
  const json = (await res.json()) as ApiOk<T> | ApiErr;
  if (!json.ok) {
    throw new ApiError(res.status, json.error.code, json.error.message);
  }
  return json.data;
}

export interface EmbeddedSeller {
  name: string;
  phone: string | null; // null when the viewer isn't the owning broker or admin
  village: string | null;
}

export interface LotListItem {
  _id: string;
  broker_id: string;
  seller: EmbeddedSeller;
  variety: 'lokwan' | 'sharbati' | 'sehore' | 'mp_sihore' | 'other';
  quantity_quintals: number;
  price_per_quintal: number;
  photos: string[];
  pickup_location: {
    city: string;
    district: string;
    pincode: string;
    geo: { type: 'Point'; coordinates: [number, number] };
  };
  available_from: string;
  status: string;
  view_count: number;
  inquiry_count: number;
  created_at: string;
}

export interface PublicBroker {
  _id: string;
  name: string | null;
  broker_mandi: string | null;
  phone?: string; // only present for authed viewers
}

export interface LotDetail extends LotListItem {
  quality: {
    moisture_pct: number;
    foreign_matter_pct: number;
    broken_pct: number;
    protein_pct?: number;
  };
  broker: PublicBroker | null;
}

export interface PriceTickItem {
  _id: string;
  grain: 'wheat';
  mandi: string;
  variety: string;
  price_min: number;
  price_modal: number;
  price_max: number;
  source: string;
  date: string;
}
