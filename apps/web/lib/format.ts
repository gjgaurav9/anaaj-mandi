import { GRAIN_EMOJI, GRAIN_LABELS, type Grain } from '@anaaj/types';

/**
 * All money is stored as integer paise on the server. UI display divides by
 * 100 and uses Indian comma grouping (₹1,23,456 not ₹123,456).
 */

const rupeesFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const numberFmt = new Intl.NumberFormat('en-IN');

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function formatRupees(paise: number): string {
  return rupeesFmt.format(paiseToRupees(paise));
}

export function formatQuintals(q: number): string {
  return `${numberFmt.format(q)} qtl`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Variety is stored as the broker's display text; just return it. */
export function formatVariety(v: string): string {
  return v;
}

export function formatGrain(g: string): string {
  return GRAIN_LABELS[g as Grain] ?? g;
}

export function grainEmoji(g: string): string {
  return GRAIN_EMOJI[g as Grain] ?? '🌱';
}

const MANDI_LABEL: Record<string, string> = {
  indore_chhawni: 'Indore Chhawni',
  indore_laxmibai_nagar: 'Indore Laxmibai Nagar',
  mhow: 'Mhow',
  dewas: 'Dewas',
  dhar: 'Dhar',
  ujjain: 'Ujjain',
  sehore: 'Sehore',
  other: 'Other',
};

export function formatMandi(m: string): string {
  return MANDI_LABEL[m] ?? m;
}
