import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Badge, Button, Card, CardBody } from '@anaaj/ui';
import { getMe } from '@/lib/me';

const ROLE_HEADLINE: Record<string, string> = {
  seller: 'Apni listings manage karo',
  broker: 'Mandi pe seller-buyer connect karo',
  buyer: 'Sahi rate ka wheat dhundo',
  admin: 'KYC + listings moderate karo',
};

const ROLE_ACTIONS: Record<string, Array<{ href: string; label: string; primary?: boolean }>> = {
  seller: [
    { href: '/lots/new', label: 'List a new lot', primary: true },
    { href: '/lots/mine', label: 'My lots' },
    { href: '/inquiries', label: 'Inquiries' },
  ],
  broker: [
    { href: '/lots/new', label: 'List on behalf of seller', primary: true },
    { href: '/lots/mine', label: 'My listings' },
    { href: '/inquiries', label: 'Inquiries' },
  ],
  buyer: [
    { href: '/browse', label: 'Browse wheat lots', primary: true },
    { href: '/inquiries', label: 'My inquiries' },
  ],
  admin: [
    { href: '/admin', label: 'Open admin console', primary: true },
    { href: '/browse', label: 'Browse all lots' },
  ],
};

export default async function DashboardPage() {
  const me = await getMe();
  if (!me) redirect('/login?next=/dashboard');

  const actions = ROLE_ACTIONS[me.role] ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-500">
            Namaste, <span className="font-medium text-neutral-800">{me.name ?? me.phone}</span>
          </p>
          <h1 className="text-2xl font-bold tracking-tight">
            {ROLE_HEADLINE[me.role] ?? 'Welcome'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={me.kyc.status === 'verified' ? 'success' : 'warn'}>
            KYC {me.kyc.status}
          </Badge>
          <Badge tone="wheat" className="capitalize">
            {me.role}
          </Badge>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {actions.map((a) => (
          <Link key={a.href} href={a.href}>
            <Button variant={a.primary ? 'primary' : 'secondary'} size="md">
              {a.label}
            </Button>
          </Link>
        ))}
      </div>

      <Card className="mt-8">
        <CardBody>
          <h2 className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">
            Your profile
          </h2>
          <dl className="mt-2 grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
            <dt className="text-neutral-500">Phone</dt>
            <dd>{me.phone}</dd>
            <dt className="text-neutral-500">Name</dt>
            <dd>{me.name ?? '—'}</dd>
            {me.business_name && (
              <>
                <dt className="text-neutral-500">Business</dt>
                <dd>{me.business_name}</dd>
              </>
            )}
            {me.broker_mandi && (
              <>
                <dt className="text-neutral-500">Mandi</dt>
                <dd>{me.broker_mandi}</dd>
              </>
            )}
            {me.buyer_company && (
              <>
                <dt className="text-neutral-500">Company</dt>
                <dd>{me.buyer_company}</dd>
              </>
            )}
          </dl>
          <Link
            href="/profile"
            className="mt-3 inline-block text-sm font-medium text-wheat-600 underline"
          >
            Edit profile
          </Link>
        </CardBody>
      </Card>

      <p className="mt-8 text-xs text-neutral-500">
        Full role-specific dashboards (charts, recent activity) arrive in step 8/9.
      </p>
    </div>
  );
}
