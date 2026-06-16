import { headers } from 'next/headers';
import { apiFetch, ApiError } from './api';

export interface MeLocation {
  city: string;
  district: string;
  state: string;
  pincode: string;
  geo?: { type: 'Point'; coordinates: [number, number] };
}

export interface MeUser {
  _id: string;
  phone: string;
  whatsapp: string | null;
  name: string | null;
  role: 'broker' | 'buyer' | 'admin';
  kyc: {
    status: 'pending' | 'verified' | 'rejected';
    gst?: string;
    pan_last4?: string;
    gst_doc_url?: string;
    submitted_at?: string;
    verified_at?: string;
    reason?: string;
  };
  rating: { avg: number; count: number };
  location: MeLocation | null;
  business_name: string | null;
  broker_mandi: string | null;
  broker_years: number | null;
  buyer_company: string | null;
  buyer_gst: string | null;
}

/**
 * Server-side helper. Returns the current user if the request carries a valid
 * session cookie, otherwise `null`. Forwards the browser's cookie header to the
 * API so it can identify the user.
 */
export async function getMe(): Promise<MeUser | null> {
  const cookie = headers().get('cookie');
  if (!cookie) return null;
  try {
    const data = await apiFetch<{ user: MeUser }>('/me', { cookie, cache: 'no-store' });
    return data.user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    return null;
  }
}
