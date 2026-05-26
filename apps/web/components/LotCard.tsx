import Link from 'next/link';
import Image from 'next/image';
import { Badge, Card, CardBody } from '@anaaj/ui';
import type { LotListItem } from '@/lib/api';
import { formatQuintals, formatRupees, formatVariety } from '@/lib/format';

export function LotCard({ lot }: { lot: LotListItem }) {
  const photo = lot.photos[0];
  return (
    <Link href={`/lots/${lot._id}`} className="block">
      <Card className="transition hover:shadow-md">
        <div className="relative aspect-[4/3] w-full bg-wheat-100">
          {photo ? (
            <Image
              src={photo}
              alt={`${formatVariety(lot.variety)} wheat`}
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center text-wheat-600">No photo</div>
          )}
          <div className="absolute left-2 top-2">
            <Badge tone="wheat">{formatVariety(lot.variety)}</Badge>
          </div>
        </div>
        <CardBody className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-lg font-semibold">{formatRupees(lot.price_per_quintal)}</span>
            <span className="text-xs text-neutral-500">per quintal</span>
          </div>
          <div className="text-sm text-neutral-700">{formatQuintals(lot.quantity_quintals)}</div>
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>{lot.pickup_location.city}</span>
            <span>{lot.inquiry_count} inquiries</span>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
