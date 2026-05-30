'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button, Card, CardBody } from '@anaaj/ui';
import { PhoneInput } from '@/components/PhoneInput';
import { OTPInput } from '@/components/OTPInput';
import { clientFetch, ClientApiError } from '@/lib/clientApi';

type Step = 'phone' | 'otp';

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/dashboard';

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
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
    setBusy(true);
    try {
      const data = await clientFetch<{ is_new_user: boolean }>('/auth/otp/verify', {
        method: 'POST',
        body: { phone: `+91${phone}`, otp },
      });
      router.push(data.is_new_user ? '/onboarding' : next);
      router.refresh();
    } catch (e) {
      if (e instanceof ClientApiError && e.code === 'role_required') {
        setError('This phone isn’t registered yet. Sign up first.');
      } else {
        setError(e instanceof ClientApiError ? e.message : 'OTP verification failed');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardBody className="space-y-5">
        <header>
          <h1 className="text-xl font-semibold">Sign in to Anaaj Mandi</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {step === 'phone'
              ? 'Apna mobile number daalein. OTP bhejenge.'
              : `OTP bhej diya hai +91 ${phone}. Type it below.`}
          </p>
        </header>

        {step === 'phone' && (
          <>
            <PhoneInput value={phone} onChange={setPhone} autoFocus />
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <Button onClick={sendOtp} disabled={busy} size="lg" className="w-full">
              {busy ? 'Sending OTP…' : 'Send OTP'}
            </Button>
            <p className="text-center text-xs text-neutral-500">
              No account?{' '}
              <a href="/signup" className="font-medium text-wheat-600 underline">
                Sign up
              </a>
            </p>
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
                {busy ? 'Verifying…' : 'Verify & sign in'}
              </Button>
            </div>
            <button
              type="button"
              onClick={sendOtp}
              disabled={busy}
              className="text-center text-xs text-wheat-600 underline"
            >
              Resend OTP
            </button>
          </>
        )}
      </CardBody>
    </Card>
  );
}
