import Image from 'next/image';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { Badge, Card, CardBody } from '@anaaj/ui';
import { apiFetch, ApiError, type LotDetail } from '@/lib/api';
import { formatDate, formatQuintals, formatRupees, formatVariety } from '@/lib/format';
import { WhatsAppButton } from '@/components/WhatsAppButton';

interface LotPageProps {
  params: { id: string };
}

interface LotResponse {
  lot: LotDetail;
}

export default async function LotDetailPage({ params }: LotPageProps) {
  let lot: LotDetail;
  try {
    const data = await apiFetch<LotResponse>(`/lots/${params.id}`, { cache: 'no-store' });
    lot = data.lot;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  // Is the user logged in? Cheap cookie-presence check; route still re-verifies
  // on the API side when the inquiry is posted.
  const sessionCookie = cookies().get(process.env.JWT_COOKIE_NAME ?? 'am_session');
  const authed = Boolean(sessionCookie?.value);

  const sellerPhone = ''; // not exposed in the public lot detail; WhatsApp link
  // is built when the buyer clicks. For now, fall back to a generic broker
  // route handler that the API will replace with the real number after auth.
  // (Auth flow + real wiring lands in step 9.)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav className="text-xs text-neutral-500">
        <span>Anaaj Mandi</span> / <span>Browse</span> /{' '}
        <span className="text-neutral-700">{formatVariety(lot.variety)} wheat</span>
      </nav>

      <div className="mt-3 grid gap-8 md:grid-cols-[3fr_2fr]">
        {/* Photos */}
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

        {/* Right column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge tone="wheat">{formatVariety(lot.variety)}</Badge>
            <Badge tone={lot.status === 'active' ? 'success' : 'neutral'}>{lot.status}</Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {formatRupees(lot.price_per_quintal)}{' '}
            <span className="text-base font-normal text-neutral-500">per quintal</span>
          </h1>
          <div className="text-neutral-700">
            <span className="font-medium">{formatQuintals(lot.quantity_quintals)}</span> available
          </div>

          <Card>
            <CardBody>
              <h2 className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">
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
              <h2 className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">
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
              <h2 className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">
                Listed by
              </h2>
              <div className="mt-1 font-medium">{lot.seller?.name ?? 'Verified seller'}</div>
              {lot.broker && (
                <div className="text-neutral-500">
                  Through {lot.broker.name ?? 'broker'}
                  {lot.broker.broker_mandi ? ` · ${lot.broker.broker_mandi}` : ''}
                </div>
              )}
              <div className="mt-1 text-xs text-neutral-500">
                {lot.view_count} views · {lot.inquiry_count} inquiries
              </div>
            </CardBody>
          </Card>

          <WhatsAppButton
            authed={authed}
            sellerPhone={sellerPhone}
            variety={lot.variety}
            quantityQuintals={lot.quantity_quintals}
            pricePerQuintalPaise={lot.price_per_quintal}
          />
        </div>
      </div>
    </div>
  );
}
