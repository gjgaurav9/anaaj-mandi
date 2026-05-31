import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Badge, Button, Card, CardBody } from '@anaaj/ui';
import { apiFetch, type LotListItem } from '@/lib/api';
import { formatGrain, formatQuintals, formatRupees, formatVariety, grainEmoji } from '@/lib/format';
import { getMe } from '@/lib/me';

interface MineResponse {
  items: LotListItem[];
}

const STATUS_TONE: Record<string, 'success' | 'warn' | 'neutral' | 'wheat'> = {
  active: 'success',
  draft: 'wheat',
  reserved: 'warn',
  sold: 'neutral',
  expired: 'neutral',
};

interface MineLotsPageProps {
  searchParams: { status?: string };
}

export default async function MyLotsPage({ searchParams }: MineLotsPageProps) {
  const me = await getMe();
  if (!me) redirect('/login?next=/lots/mine');
  if (me.role !== 'broker' && me.role !== 'admin') redirect('/dashboard');

  const cookie = headers().get('cookie') ?? '';
  let items: LotListItem[] = [];
  let error: string | null = null;
  try {
    const data = await apiFetch<MineResponse>('/lots/mine', { cookie, cache: 'no-store' });
    items = data.items;
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load your lots';
  }

  const filter = searchParams.status;
  const filtered = filter ? items.filter((i) => i.status === filter) : items;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="border-b border-neutral-200 bg-white px-4 py-3 md:py-4">
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-lg font-semibold tracking-tight md:text-2xl">Meri listings</h1>
          <Link href="/lots/new">
            <Button size="sm">+ Add</Button>
          </Link>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          <StatusChip current={filter} value={undefined} label={`All (${items.length})`} />
          {(['active', 'draft', 'reserved', 'sold', 'expired'] as const).map((s) => {
            const count = items.filter((i) => i.status === s).length;
            if (count === 0) return null;
            return <StatusChip key={s} current={filter} value={s} label={`${s} (${count})`} />;
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-2">
        {error && <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        {!error && filtered.length === 0 && (
          <div className="rounded-md border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
            No lots yet — tap <strong>Add</strong> to upload your first one.
          </div>
        )}
        {filtered.map((lot) => (
          <Link key={lot._id} href={`/lots/${lot._id}`} className="block">
            <Card>
              <div className="flex gap-3">
                <div className="relative h-24 w-24 flex-shrink-0 bg-wheat-100">
                  {lot.photos[0] && (
                    <Image
                      src={lot.photos[0]}
                      alt={formatVariety(lot.variety)}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  )}
                </div>
                <CardBody className="flex-1 space-y-1 py-3 pr-3 pl-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-wheat-600">
                      <span className="mr-1" aria-hidden>
                        {grainEmoji(lot.grain)}
                      </span>
                      {formatGrain(lot.grain)} · {formatVariety(lot.variety)}
                    </span>
                    <Badge tone={STATUS_TONE[lot.status] ?? 'neutral'}>{lot.status}</Badge>
                  </div>
                  <div className="text-base font-semibold text-neutral-900">
                    {formatRupees(lot.price_per_quintal)}
                    <span className="ml-1 text-xs font-normal text-neutral-500">/qtl</span>
                  </div>
                  <div className="text-xs text-neutral-600">
                    {formatQuintals(lot.quantity_quintals)} · {lot.pickup_location.city}
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Farmer: {lot.seller.name}
                    {lot.seller.village ? ` (${lot.seller.village})` : ''} · {lot.inquiry_count}{' '}
                    inquiries
                  </div>
                </CardBody>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatusChip({
  current,
  value,
  label,
}: {
  current: string | undefined;
  value: string | undefined;
  label: string;
}) {
  const active = current === value;
  const href = value ? `/lots/mine?status=${value}` : '/lots/mine';
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        active ? 'bg-wheat-500 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
      }`}
    >
      {label}
    </Link>
  );
}
