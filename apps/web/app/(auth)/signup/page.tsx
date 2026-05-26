'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Card, CardBody } from '@anaaj/ui';
import { PhoneInput } from '@/components/PhoneInput';
import { OTPInput } from '@/components/OTPInput';
import { clientFetch, ClientApiError } from '@/lib/clientApi';

type Step = 'role' | 'phone' | 'otp' | 'name';
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
    sub: 'Variety, quality aur price ke hisaab se wheat dhundo. Broker se direct connect.',
    emoji: '🏭',
  },
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<Role | null>(null);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendOtp() {
    setError(null);
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setBusy(true);
    try {
      await clientFetch('/auth/otp/send', {
        method: 'POST',
        body: { phone: `+91${phone}` },
      });
      setStep('otp');
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : 'Failed to send OTP');
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setError(null);
    if (otp.length !== 6) {
      setError('OTP must be 6 digits.');
      return;
    }
    if (!role) {
      setError('Role missing. Start over from step 1.');
      setStep('role');
      return;
    }
    setBusy(true);
    try {
      await clientFetch('/auth/otp/verify', {
        method: 'POST',
        body: { phone: `+91${phone}`, otp, role },
      });
      setStep('name');
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : 'OTP verification failed');
    } finally {
      setBusy(false);
    }
  }

  async function saveName() {
    setError(null);
    if (name.trim().length < 2) {
      setError('Please enter your name.');
      return;
    }
    setBusy(true);
    try {
      await clientFetch('/me', { method: 'PATCH', body: { name: name.trim() } });
      router.push('/onboarding');
      router.refresh();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : 'Could not save profile');
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
            {step === 'role' && 'Step 1 of 4 — Pick your role'}
            {step === 'phone' && 'Step 2 of 4 — Your mobile number'}
            {step === 'otp' && `Step 3 of 4 — Type the OTP we sent to +91 ${phone}`}
            {step === 'name' && 'Step 4 of 4 — Your name'}
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
                  setStep('phone');
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

        {step === 'phone' && (
          <>
            <p className="rounded-md bg-wheat-50 px-3 py-2 text-xs text-wheat-600">
              Selected role: <span className="font-medium capitalize">{role}</span> ·{' '}
              <button type="button" onClick={() => setStep('role')} className="underline">
                change
              </button>
            </p>
            <PhoneInput value={phone} onChange={setPhone} autoFocus />
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <Button onClick={sendOtp} disabled={busy} size="lg" className="w-full">
              {busy ? 'Sending OTP…' : 'Send OTP'}
            </Button>
            <p className="rounded-md bg-wheat-50 px-3 py-2 text-center text-xs text-wheat-600">
              Dev mode: OTP <span className="font-mono font-semibold">123456</span> is always
              accepted.
            </p>
          </>
        )}

        {step === 'otp' && (
          <>
            <div className="space-y-2">
              <label className="text-xs font-medium text-neutral-700">OTP</label>
              <OTPInput value={otp} onChange={setOtp} autoFocus />
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="lg"
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                  setError(null);
                }}
              >
                Back
              </Button>
              <Button
                onClick={verify}
                disabled={busy || otp.length !== 6}
                size="lg"
                className="flex-1"
              >
                {busy ? 'Verifying…' : 'Verify & continue'}
              </Button>
            </div>
          </>
        )}

        {step === 'name' && (
          <>
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
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <Button onClick={saveName} disabled={busy} size="lg" className="w-full">
              {busy ? 'Saving…' : 'Continue to onboarding'}
            </Button>
          </>
        )}
      </CardBody>
    </Card>
  );
}
