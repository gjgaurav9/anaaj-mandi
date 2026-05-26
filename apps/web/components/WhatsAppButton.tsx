'use client';

import { useState } from 'react';
import { Button } from '@anaaj/ui';
import { buildWhatsAppLink, type BuildWhatsAppLinkArgs } from '@/lib/whatsapp';
import { clientFetch, ClientApiError } from '@/lib/clientApi';

interface WhatsAppButtonProps extends BuildWhatsAppLinkArgs {
  /** Pass the lot id when authed so we can POST /inquiries on click. */
  lotId?: string;
  authed: boolean;
  /** Broker-side or admin: hide the connect CTA (their own lot). */
  hideForOwner?: boolean;
}

export function WhatsAppButton({ lotId, authed, hideForOwner, ...waArgs }: WhatsAppButtonProps) {
  const [busy, setBusy] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  if (hideForOwner) return null;

  if (!authed) {
    return (
      <a href="/login" className="block">
        <Button variant="secondary" size="lg" className="w-full">
          Sign in to connect on WhatsApp
        </Button>
      </a>
    );
  }

  async function handleClick() {
    setWarning(null);
    if (!lotId) {
      // Public lot detail without lotId — just open the link.
      window.open(buildWhatsAppLink(waArgs), '_blank', 'noopener,noreferrer');
      return;
    }
    setBusy(true);
    try {
      await clientFetch('/inquiries', {
        method: 'POST',
        body: { lot_id: lotId, channel: 'whatsapp', message: '' },
      });
    } catch (e) {
      // 24h dedupe is fine — we still let the user open WhatsApp.
      if (e instanceof ClientApiError && e.code === 'inquiry_dedupe') {
        setWarning('Aapne pichle 24 ghante me already inquire kiya tha — WhatsApp open kar rahe.');
      } else {
        setWarning(
          e instanceof ClientApiError ? e.message : 'Connect failed; opening WhatsApp anyway.',
        );
      }
    } finally {
      setBusy(false);
    }
    window.open(buildWhatsAppLink(waArgs), '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="space-y-1">
      <Button variant="whatsapp" size="lg" className="w-full" onClick={handleClick} disabled={busy}>
        {busy ? 'Connecting…' : 'Connect on WhatsApp'}
      </Button>
      {warning && <p className="text-center text-xs text-amber-700">{warning}</p>}
    </div>
  );
}
