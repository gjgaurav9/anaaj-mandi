'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Card, CardBody } from '@anaaj/ui';
import { PhoneInput } from '@/components/PhoneInput';
import { clientFetch, ClientApiError } from '@/lib/clientApi';

/**
 * Two-step sign up: pick role, then enter name + phone. The OTP step is
 * skipped while the dev bypass is on — see [[project-anaaj-mandi-deferred]].
 */
type Step = 'role' | 'profile';
type Role = 'broker' | 'buyer';

const ROLE_CARDS: Array<{ id: Role; title: string; sub: string; emoji: string }> = [
  {
    id: 'broker',
    title: 'Broker (Mandi)',
    sub: 'Apne farmers ki listings post karo, buyers se WhatsApp pe connect karo.',
    emoji: '🤝',
  },
  {
    id: 'buyer',
    title: 'Buyer (Mill / Exporter)',
    sub: 'Grain chuno, variety + quality compare karo, broker se direct connect.',
    emoji: '🏭',
  },
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createAccount() {
    setError(null);
    if (!role) {
      setError('Pick a role first.');
      setStep('role');
      return;
    }
    if (name.trim().length < 2) {
      setError('Please enter your name.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setBusy(true);
    try {
      const e164 = `+91${phone}`;
      // OTP send + verify with the dev bypass code.
      await clientFetch('/auth/otp/send', { method: 'POST', body: { phone: e164 } });
      await clientFetch('/auth/otp/verify', {
        method: 'POST',
        body: { phone: e164, otp: '123456', role },
      });
      // Save the name on the freshly-created user.
      await clientFetch('/me', { method: 'PATCH', body: { name: name.trim() } });
      router.push('/onboarding');
      router.refresh();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : 'Could not create account');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardBody className="space-y-5">
        <header>
          <h1 className="text-xl font-semibold">Sign up · Anaaj Mandi</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {step === 'role' && 'Step 1 of 2 — Pick your role'}
            {step === 'profile' && 'Step 2 of 2 — Your name and mobile'}
          </p>
        </header>

        {step === 'role' && (
          <div className="space-y-2">
            {ROLE_CARDS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setRole(r.id);
                  setStep('profile');
                }}
                className="flex w-full items-center gap-3 rounded-lg border border-neutral-200 p-3 text-left transition hover:border-wheat-400 hover:bg-wheat-50"
              >
                <span className="text-2xl">{r.emoji}</span>
                <span>
                  <span className="block font-medium">{r.title}</span>
                  <span className="block text-xs text-neutral-500">{r.sub}</span>
                </span>
              </button>
            ))}
            <p className="text-center text-xs text-neutral-500">
              Already have an account?{' '}
              <a href="/login" className="font-medium text-wheat-600 underline">
                Sign in
              </a>
            </p>
          </div>
        )}

        {step === 'profile' && (
          <>
            <p className="rounded-md bg-wheat-50 px-3 py-2 text-xs text-wheat-600">
              Role: <span className="font-medium capitalize">{role}</span> ·{' '}
              <button type="button" onClick={() => setStep('role')} className="underline">
                change
              </button>
            </p>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-neutral-700">Your name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ramesh Patidar"
                className="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-wheat-500 focus:outline-none focus:ring-1 focus:ring-wheat-500"
                autoFocus
              />
            </label>
            <PhoneInput value={phone} onChange={setPhone} />
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <Button onClick={createAccount} disabled={busy} size="lg" className="w-full">
              {busy ? 'Creating account…' : 'Create account'}
            </Button>
            <p className="rounded-md bg-wheat-50 px-3 py-2 text-center text-xs text-wheat-600">
              Demo mode — no OTP / verification required right now.
            </p>
          </>
        )}
      </CardBody>
    </Card>
  );
}
