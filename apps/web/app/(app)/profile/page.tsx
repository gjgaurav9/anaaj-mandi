import { redirect } from 'next/navigation';
import { Card, CardBody } from '@anaaj/ui';
import { getMe } from '@/lib/me';

export default async function ProfilePage() {
  const me = await getMe();
  if (!me) redirect('/login?next=/profile');

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:py-10">
      <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
      <p className="mt-1 text-neutral-600">
        Profile edit form (location, business name, KYC docs) lands in step&nbsp;8. For now, this is
        a read-only view of what we have on file.
      </p>

      <Card className="mt-6">
        <CardBody>
          <dl className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
            <dt className="text-neutral-500">Phone</dt>
            <dd>{me.phone}</dd>
            <dt className="text-neutral-500">Name</dt>
            <dd>{me.name ?? '—'}</dd>
            <dt className="text-neutral-500">Role</dt>
            <dd className="capitalize">{me.role}</dd>
            <dt className="text-neutral-500">KYC</dt>
            <dd>{me.kyc.status}</dd>
            <dt className="text-neutral-500">Business</dt>
            <dd>{me.business_name ?? '—'}</dd>
            <dt className="text-neutral-500">Broker mandi</dt>
            <dd>{me.broker_mandi ?? '—'}</dd>
            <dt className="text-neutral-500">Buyer company</dt>
            <dd>{me.buyer_company ?? '—'}</dd>
          </dl>
        </CardBody>
      </Card>
    </div>
  );
}
