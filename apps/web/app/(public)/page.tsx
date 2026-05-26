import Link from 'next/link';
import { Button, Card, CardBody } from '@anaaj/ui';
import { PriceTicker } from '@/components/PriceTicker';

const STEPS_BY_ROLE = {
  seller: [
    {
      title: 'List your wheat',
      body: 'Variety, quantity, price, photos — 2 minutes pe ho jata hai.',
    },
    {
      title: 'Buyer connect karte hain',
      body: 'WhatsApp pe seedha buyer aapse baat karega. No middleman fees.',
    },
    {
      title: 'Sale record karo',
      body: 'Sale ho jane ke baad app me record kar do — apna history banta hai.',
    },
  ],
  broker: [
    {
      title: 'Apne sellers ki listings post karo',
      body: 'Bina KYC hassle ke, aap khud lot create karke buyer tak bhej sakte ho.',
    },
    {
      title: 'Inquiries handle karo',
      body: 'Buyer ki inquiry aapko app me bhi milegi, aur WhatsApp pe bhi.',
    },
    {
      title: 'Trust build karo',
      body: 'Verified KYC se aapke listings priority me dikhte hain.',
    },
  ],
  buyer: [
    {
      title: 'Browse karo',
      body: 'Indore aur aas-paas ki saari wheat listings ek jagah pe.',
    },
    {
      title: 'Variety + quality compare karo',
      body: 'Moisture, foreign matter, protein — har lot ka spec available hai.',
    },
    {
      title: 'WhatsApp pe connect karo',
      body: 'Direct seller/broker se baat. Mandi rate live dikhta hai.',
    },
  ],
};

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-wheat-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full bg-wheat-100 px-3 py-1 text-xs font-medium text-wheat-600">
              Indore · Madhya Pradesh
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
              Wheat trade ka <span className="text-wheat-600">sabse seedha</span> raasta.
            </h1>
            <p className="mt-4 text-lg text-neutral-700">
              Anaaj Mandi connects farmers, brokers aur buyers — bina commission, bina paperwork.
              Listing dekho, WhatsApp pe connect karo, deal ho jaye.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/browse">
                <Button size="lg">Browse wheat lots</Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="secondary">
                  Apni listing daalo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Price ticker */}
      <PriceTicker />

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold tracking-tight">How it works</h2>
        <p className="mt-1 text-neutral-600">Same app, teen alag perspectives. Choose your role:</p>

        <Tabs />
      </section>
    </div>
  );
}

function Tabs() {
  // SSR-friendly "anchor tabs" — no JS needed.
  const roles: Array<{ id: string; label: string }> = [
    { id: 'seller', label: 'Sellers (kisaan/trader)' },
    { id: 'broker', label: 'Brokers (mandi)' },
    { id: 'buyer', label: 'Buyers (mill/exporter)' },
  ];

  return (
    <div className="mt-6 space-y-10">
      {roles.map((r) => {
        const steps = STEPS_BY_ROLE[r.id as keyof typeof STEPS_BY_ROLE];
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
