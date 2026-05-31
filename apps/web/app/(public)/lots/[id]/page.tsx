import Image from 'next/image';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { Badge, Card, CardBody } from '@anaaj/ui';
import { apiFetch, ApiError, type LotDetail } from '@/lib/api';
import {
  formatDate,
  formatGrain,
  formatQuintals,
  formatRupees,
  formatVariety,
  grainEmoji,
} from '@/lib/format';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { getMe } from '@/lib/me';

interface LotPageProps {
  params: { id: string };
}

interface LotResponse {
  lot: LotDetail;
}

export default async function LotDetailPage({ params }: LotPageProps) {
  const cookie = headers().get('cookie') ?? '';
  let lot: LotDetail;
  try {
    const data = await apiFetch<LotResponse>(`/lots/${params.id}`, {
      cookie,
      cache: 'no-store',
    });
    lot = data.lot;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const me = await getMe();
  const authed = Boolean(me);
  const isOwnerOrAdmin = Boolean(
    me && (me.role === 'admin' || (lot.broker?._id && lot.broker._id === me._id)),
  );

  const brokerPhone = lot.broker?.phone ?? '';

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 md:py-8">
      <nav className="text-xs text-neutral-500">
        <a href="/browse" className="hover:underline">
          Browse
        </a>{' '}
        /{' '}
        <a href={`/browse?grain=${lot.grain}`} className="hover:underline">
          {formatGrain(lot.grain)}
        </a>{' '}
        / <span className="text-neutral-700">{formatVariety(lot.variety)}</span>
      </nav>

      {/* Two-column on desktop, stacked on mobile */}
      <div className="mt-3 grid gap-6 md:grid-cols-[3fr_2fr] md:gap-8">
        {/* Photos column */}
        <div className="space-y-3">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-wheat-100 bg-wheat-100">
            {lot.photos[0] ? (
              <Image
                src={lot.photos[0]}
                alt={`${formatVariety(lot.variety)} wheat`}
                fill
                sizes="(min-width: 768px) 60vw, 100vw"
                priority
                className="object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center text-wheat-600">No photo</div>
            )}
          </div>
          {lot.photos.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {lot.photos.slice(1).map((p, i) => (
                <div
                  key={`${p}-${i}`}
                  className="relative aspect-square overflow-hidden rounded-lg border border-wheat-100 bg-wheat-50"
                >
                  <Image
                    src={p}
                    alt={`photo ${i + 2}`}
                    fill
                    sizes="(min-width: 768px) 15vw, 25vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details column */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="wheat">
              <span className="mr-1" aria-hidden>
                {grainEmoji(lot.grain)}
              </span>
              {formatGrain(lot.grain)}
            </Badge>
            <Badge tone="neutral">{formatVariety(lot.variety)}</Badge>
            <Badge tone={lot.status === 'active' ? 'success' : 'neutral'}>{lot.status}</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {formatRupees(lot.price_per_quintal)}{' '}
            <span className="text-sm font-normal text-neutral-500 md:text-base">per quintal</span>
          </h1>
          <div className="text-sm text-neutral-700 md:text-base">
            <span className="font-medium">{formatQuintals(lot.quantity_quintals)}</span> available
          </div>

          <Card>
            <CardBody>
              <h2 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                Quality
              </h2>
              <dl className="mt-2 grid grid-cols-2 gap-y-1 text-sm">
                <dt className="text-neutral-500">Moisture</dt>
                <dd className="text-right">{lot.quality.moisture_pct}%</dd>
                <dt className="text-neutral-500">Foreign matter</dt>
                <dd className="text-right">{lot.quality.foreign_matter_pct}%</dd>
                <dt className="text-neutral-500">Broken grains</dt>
                <dd className="text-right">{lot.quality.broken_pct}%</dd>
                {lot.quality.protein_pct !== undefined && (
                  <>
                    <dt className="text-neutral-500">Protein</dt>
                    <dd className="text-right">{lot.quality.protein_pct}%</dd>
                  </>
                )}
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-1 text-sm">
              <h2 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                Pickup
              </h2>
              <div>
                {lot.pickup_location.city}, {lot.pickup_location.district} ·{' '}
                {lot.pickup_location.pincode}
              </div>
              <div className="text-neutral-500">
                Available from {formatDate(lot.available_from)}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-sm">
              <h2 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                Listed by
              </h2>
              <div className="mt-1 font-medium">
                {lot.broker?.name ?? 'Verified broker'}
                {lot.broker?.broker_mandi ? (
                  <span className="text-neutral-500"> · {lot.broker.broker_mandi}</span>
                ) : null}
              </div>
              <div className="text-neutral-500">
                Farmer: <span className="font-medium text-neutral-700">{lot.seller.name}</span>
                {lot.seller.village ? ` (${lot.seller.village})` : ''}
              </div>
              <div className="mt-1 text-xs text-neutral-500">
                {lot.view_count} views · {lot.inquiry_count} inquiries
              </div>
            </CardBody>
          </Card>

          {me?.role === 'buyer' ? (
            <WhatsAppButton
              lotId={lot._id}
              authed={authed}
              sellerPhone={brokerPhone}
              variety={lot.variety}
              quantityQuintals={lot.quantity_quintals}
              pricePerQuintalPaise={lot.price_per_quintal}
            />
          ) : !authed ? (
            <WhatsAppButton
              authed={false}
              sellerPhone=""
              variety={lot.variety}
              quantityQuintals={lot.quantity_quintals}
              pricePerQuintalPaise={lot.price_per_quintal}
            />
          ) : isOwnerOrAdmin ? (
            <div className="rounded-md bg-wheat-50 px-3 py-2 text-center text-xs text-wheat-600">
              Yeh aapki listing hai — buyer inquiries{' '}
              <a href="/inquiries" className="font-medium underline">
                Inquiries
              </a>{' '}
              tab pe milengi.
            </div>
          ) : (
            <div className="rounded-md bg-neutral-100 px-3 py-2 text-center text-xs text-neutral-600">
              Brokers can&apos;t inquire on other brokers&apos; lots.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
