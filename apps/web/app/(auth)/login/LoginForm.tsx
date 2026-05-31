'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button, Card, CardBody } from '@anaaj/ui';
import { PhoneInput } from '@/components/PhoneInput';
import { clientFetch, ClientApiError } from '@/lib/clientApi';

/**
 * One-step sign in. We auto-bypass the OTP step (123456 is accepted by the
 * API while OTP_DEV_BYPASS=true). The OTP screen returns when real SMS is
 * wired — see [[project-anaaj-mandi-deferred]].
 */
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/dashboard';

  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setError(null);
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setBusy(true);
    try {
      const e164 = `+91${phone}`;
      // Silently chain the OTP flow with the dev bypass code.
      await clientFetch('/auth/otp/send', { method: 'POST', body: { phone: e164 } });
      const data = await clientFetch<{ is_new_user: boolean }>('/auth/otp/verify', {
        method: 'POST',
        body: { phone: e164, otp: '123456' },
      });
      router.push(data.is_new_user ? '/onboarding' : next);
      router.refresh();
    } catch (e) {
      if (e instanceof ClientApiError && e.code === 'role_required') {
        setError("This phone isn't registered yet. Tap “Sign up” to create an account.");
      } else {
        setError(e instanceof ClientApiError ? e.message : 'Sign in failed');
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
            Bas apna mobile number daalein. Account hai to seedha login ho jayega.
          </p>
        </header>

        <PhoneInput value={phone} onChange={setPhone} autoFocus />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <Button onClick={signIn} disabled={busy} size="lg" className="w-full">
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>

        <p className="text-center text-xs text-neutral-500">
          No account?{' '}
          <a href="/signup" className="font-medium text-wheat-600 underline">
            Sign up
          </a>
        </p>
        <p className="rounded-md bg-wheat-50 px-3 py-2 text-center text-xs text-wheat-600">
          Demo mode — no OTP required while we wire up real SMS. Any registered phone works.
        </p>
      </CardBody>
    </Card>
  );
}
