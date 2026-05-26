import { formatVariety } from './format';

export interface BuildWhatsAppLinkArgs {
  sellerPhone: string; // E.164 +91XXXXXXXXXX
  variety: string;
  quantityQuintals: number;
  pricePerQuintalPaise: number;
}

/**
 * Builds a wa.me deep link with a Hinglish inquiry template.
 *
 * Template:
 *   "Namaste, Anaaj Mandi app se aapki {variety} wheat ki listing dekhi —
 *    {quantity} quintal at ₹{price}/qtl. Available?"
 */
export function buildWhatsAppLink(args: BuildWhatsAppLinkArgs): string {
  const digits = args.sellerPhone.replace(/[^\d]/g, '');
  const priceRupees = Math.round(args.pricePerQuintalPaise / 100);
  const message =
    `Namaste, Anaaj Mandi app se aapki ${formatVariety(args.variety)} wheat ki listing dekhi — ` +
    `${args.quantityQuintals} quintal at ₹${priceRupees.toLocaleString('en-IN')}/qtl. Available?`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
