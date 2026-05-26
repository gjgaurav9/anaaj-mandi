import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Badge, Card, CardBody } from '@anaaj/ui';
import { apiFetch } from '@/lib/api';
import { formatQuintals, formatRupees, formatVariety } from '@/lib/format';
import { getMe } from '@/lib/me';

interface InquiryRow {
  _id: string;
  status: 'sent' | 'viewed' | 'replied' | 'closed';
  channel: 'whatsapp' | 'call' | 'platform';
  message: string;
  created_at: string;
  lot: {
    _id: string;
    variety: string;
    quantity_quintals: number;
    price_per_quintal: number;
    city: string | null;
  } | null;
  counterparty: {
    _id: string;
    name: string | null;
    phone: string | null;
    broker_mandi: string | null;
    buyer_company: string | null;
  } | null;
}

interface InquiriesResponse {
  items: InquiryRow[];
}

const STATUS_TONE: Record<InquiryRow['status'], 'success' | 'warn' | 'neutral' | 'wheat'> = {
  sent: 'wheat',
  viewed: 'warn',
  replied: 'success',
  closed: 'neutral',
};

export default async function InquiriesPage() {
  const me = await getMe();
  if (!me) redirect('/login?next=/inquiries');

  const cookie = headers().get('cookie') ?? '';
  const endpoint =
    me.role === 'broker' ? '/inquiries/received' : me.role === 'buyer' ? '/inquiries/sent' : null;

  if (!endpoint) {
    return (
      <div className="px-4 py-6 text-sm text-neutral-600">
        Admin role doesn&apos;t have its own inquiries view in v1. Use the admin console.
      </div>
    );
  }

  let items: InquiryRow[] = [];
  let error: string | null = null;
  try {
    const data = await apiFetch<InquiriesResponse>(endpoint, { cookie, cache: 'no-store' });
    items = data.items;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load inquiries';
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="border-b border-neutral-200 bg-white px-4 py-3 md:py-4">
        <h1 className="text-lg font-semibold tracking-tight md:text-2xl">
          {me.role === 'broker' ? 'Buyer inquiries' : 'Meri inquiries'}
        </h1>
        <p className="text-xs text-neutral-500 md:text-sm">
          {me.role === 'broker'
            ? 'Aap pe interest karne wale buyers — WhatsApp pe inhi se baat hui hai.'
            : 'Jin lots me aapne interest dikhaya hai.'}
        </p>
      </div>

      <div className="space-y-3 px-4 py-4">
        {error && <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        {!error && items.length === 0 && (
          <div className="rounded-md border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
            {me.role === 'broker'
              ? 'No buyer inquiries yet. Listings active ho jaane par buyers WhatsApp pe contact karenge.'
              : "You haven't connected with any broker yet. Browse some lots →"}
          </div>
        )}
        {items.map((row) => (
          <Card key={row._id}>
            <CardBody className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-medium">
                  {row.counterparty?.name ?? 'Anonymous'}
                  {row.counterparty?.buyer_company ? (
                    <span className="text-neutral-500"> · {row.counterparty.buyer_company}</span>
                  ) : null}
                  {row.counterparty?.broker_mandi ? (
                    <span className="text-neutral-500"> · {row.counterparty.broker_mandi}</span>
                  ) : null}
                </div>
                <Badge tone={STATUS_TONE[row.status]}>{row.status}</Badge>
              </div>

              {row.counterparty?.phone && (
                <div className="text-xs text-neutral-600">
                  <a
                    href={`https://wa.me/${row.counterparty.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-emerald-700 underline"
                  >
                    WhatsApp {row.counterparty.phone}
                  </a>
                </div>
              )}

              {row.lot && (
                <Link
                  href={`/lots/${row.lot._id}`}
                  className="block rounded-md bg-wheat-50 px-3 py-2 text-xs"
                >
                  <span className="font-medium text-wheat-600">
                    {formatVariety(row.lot.variety)}
                  </span>{' '}
                  · {formatRupees(row.lot.price_per_quintal)}/qtl ·{' '}
                  {formatQuintals(row.lot.quantity_quintals)}
                  {row.lot.city ? ` · ${row.lot.city}` : ''}
                </Link>
              )}

              {row.message && <p className="text-xs text-neutral-600">“{row.message}”</p>}

              <div className="text-[11px] text-neutral-400">
                via {row.channel} · {new Date(row.created_at).toLocaleString('en-IN')}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
