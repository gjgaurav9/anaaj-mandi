import Link from 'next/link';
import { Card, CardBody } from '@anaaj/ui';
import { apiFetch, type LotListItem } from '@/lib/api';
import { GrainTilesGrid } from '@/components/GrainTilesGrid';
import { PriceTicker } from '@/components/PriceTicker';

interface ListResponse {
  items: LotListItem[];
  pagination: { page: number; limit: number; total: number; has_more: boolean };
}

const STEPS_BY_ROLE = {
  broker: [
    {
      title: 'Apne farmers ki listings upload karo',
      body: 'Grain, variety, ₹/qtl, quality — 2 minute me lot publish ho jata hai.',
    },
    {
      title: 'Buyer aap pe inquire karte hain',
      body: 'WhatsApp pe seedha buyer aapko message karega. App me bhi inquiry record ho jati hai.',
    },
    {
      title: 'Deal close karo, history banao',
      body: 'Verified KYC + recorded transactions se trust score badhta hai.',
    },
  ],
  buyer: [
    {
      title: 'Grain chuno',
      body: 'Wheat, soybean, chana, maize, mustard — jo bhi chahiye, ek hi jagah pe.',
    },
    {
      title: 'Variety + quality compare karo',
      body: 'Moisture, foreign matter, broken %, protein — har lot ka spec available hai.',
    },
    {
      title: 'WhatsApp pe connect karo',
      body: 'Broker se direct baat. Aaj ka mandi rate bhi live dikhta hai.',
    },
  ],
};

/** Aggregate active-lot counts per grain so the tile grid can show inventory. */
async function loadCounts(): Promise<Partial<Record<string, number>>> {
  try {
    // Quick & cheap: pull up to 100 active lots and count locally. Once we have
    // more inventory we'll add a /grains/stats endpoint to do this server-side.
    const data = await apiFetch<ListResponse>('/lots?limit=100', { revalidate: 60 });
    const counts: Record<string, number> = {};
    for (const l of data.items) counts[l.grain] = (counts[l.grain] ?? 0) + 1;
    return counts;
  } catch {
    return {};
  }
}

export default async function LandingPage() {
  const counts = await loadCounts();
  return (
    <div>
      {/* Hero — one line, no fluff */}
      <section className="bg-gradient-to-b from-wheat-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full bg-wheat-100 px-3 py-1 text-xs font-medium text-wheat-600">
              All India · Mandi to mill
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              India ka <span className="text-wheat-600">sabse seedha</span> grain marketplace.
            </h1>
            <p className="mt-3 text-base text-neutral-700 md:text-lg">
              Brokers apne farmers ki listings upload karte hain, buyers WhatsApp pe seedha connect
              karte hain. Sign-in chahiye nahi — niche grain chuno aur dekho.
            </p>
          </div>
        </div>
      </section>

      {/* Grain selector — the new home */}
      <section className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">Pick a grain to browse</h2>
          <Link
            href="/browse"
            className="text-sm font-medium text-wheat-600 underline underline-offset-2"
          >
            See all lots →
          </Link>
        </div>
        <GrainTilesGrid counts={counts} />
      </section>

      {/* Mandi rates — public */}
      <PriceTicker />

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <h2 className="text-xl font-bold tracking-tight md:text-2xl">How it works</h2>
        <p className="mt-1 text-neutral-600">
          Aap broker ho ya buyer — same app, alag perspective.
        </p>
        <Tabs />
      </section>
    </div>
  );
}

function Tabs() {
  const roles: Array<{ id: keyof typeof STEPS_BY_ROLE; label: string }> = [
    { id: 'broker', label: 'Brokers (Mandi)' },
    { id: 'buyer', label: 'Buyers (Mill / Exporter)' },
  ];
  return (
    <div className="mt-6 space-y-10">
      {roles.map((r) => {
        const steps = STEPS_BY_ROLE[r.id];
        return (
          <div key={r.id} id={r.id}>
            <h3 className="text-lg font-semibold text-wheat-600">{r.label}</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {steps.map((s, idx) => (
                <Card key={s.title}>
                  <CardBody>
                    <div className="text-xs font-medium text-neutral-400">Step {idx + 1}</div>
                    <div className="mt-1 font-semibold">{s.title}</div>
                    <p className="mt-1 text-sm text-neutral-600">{s.body}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
