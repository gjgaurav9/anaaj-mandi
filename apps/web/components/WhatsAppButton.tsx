'use client';

import { Button } from '@anaaj/ui';
import { buildWhatsAppLink, type BuildWhatsAppLinkArgs } from '@/lib/whatsapp';

interface WhatsAppButtonProps extends BuildWhatsAppLinkArgs {
  /** When false, the button links to /login instead of WhatsApp. */
  authed: boolean;
  /** Optional callback fired before opening the link (e.g. POST /inquiries). */
  onBeforeOpen?: () => void;
}

export function WhatsAppButton(props: WhatsAppButtonProps) {
  if (!props.authed) {
    return (
      <a href="/login" className="block">
        <Button variant="secondary" size="lg" className="w-full">
          Sign in to connect on WhatsApp
        </Button>
      </a>
    );
  }
  const href = buildWhatsAppLink(props);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => props.onBeforeOpen?.()}
      className="block"
    >
      <Button variant="whatsapp" size="lg" className="w-full">
        Connect on WhatsApp
      </Button>
    </a>
  );
}
