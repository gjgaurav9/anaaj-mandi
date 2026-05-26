import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button, Card, CardBody } from '@anaaj/ui';
import { getMe } from '@/lib/me';

export default async function OnboardingPage() {
  const me = await getMe();
  if (!me) redirect('/login?next=/onboarding');

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Welcome to Anaaj Mandi</h1>
      <p className="mt-1 text-neutral-600">
        Your account is ready. KYC is currently <strong>{me.kyc.status}</strong> — admin will verify
        shortly. In the meantime:
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Card>
          <CardBody className="space-y-2">
            <h2 className="font-semibold">Complete your profile</h2>
            <p className="text-sm text-neutral-600">
              Add your business name, location and other details so buyers and sellers know who
              they’re dealing with.
            </p>
            <Link href="/profile">
              <Button size="sm" variant="secondary">
                Edit profile
              </Button>
            </Link>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="space-y-2">
            <h2 className="font-semibold">Jump in</h2>
            <p className="text-sm text-neutral-600">
              {me.role === 'buyer'
                ? 'Start browsing today’s wheat lots and connect on WhatsApp.'
                : 'List your first wheat lot — yeh sirf 2 minutes ka kaam hai.'}
            </p>
            <Link href={me.role === 'buyer' ? '/browse' : '/lots/new'}>
              <Button size="sm">{me.role === 'buyer' ? 'Browse lots' : 'Create a lot'}</Button>
            </Link>
          </CardBody>
        </Card>
      </div>

      <div className="mt-8">
        <Link href="/dashboard" className="text-sm font-medium text-wheat-600 underline">
          Skip and go to dashboard →
        </Link>
      </div>
    </div>
  );
}
