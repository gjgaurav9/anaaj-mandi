import Link from 'next/link';
import { Button, Card, CardBody } from '@anaaj/ui';
import { PriceTicker } from '@/components/PriceTicker';

const STEPS_BY_ROLE = {
  broker: [
    {
      title: 'Apne farmers ki listings upload karo',
      body: 'Variety, quantity, ₹/qtl, quality — 2 minute me lot publish ho jata hai.',
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
      title: 'Browse karo',
      body: 'Indore aur aas-paas ki saari active wheat listings ek hi jagah pe.',
    },
    {
      title: 'Variety + quality compare karo',
      body: 'Moisture, foreign matter, broken %, protein — har lot ka spec available hai.',
    },
    {
      title: 'WhatsApp pe connect karo',
      body: 'Broker se direct baat. Mandi rate bhi live dikhta hai.',
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
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Mandi ka <span className="text-wheat-600">sabse seedha</span> wheat marketplace.
            </h1>
            <p className="mt-4 text-base text-neutral-700 md:text-lg">
              Brokers apne farmers ki listings upload karte hain, buyers WhatsApp pe seedha connect
              karte hain. Bina commission, bina paperwork.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/browse">
                <Button size="lg">Browse wheat lots</Button>
              </Link>
              <Link href="/signup">
                <Button size="lg" variant="secondary">
                  Sign up as broker / buyer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Price ticker */}
      <PriceTicker />

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">How it works</h2>
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
