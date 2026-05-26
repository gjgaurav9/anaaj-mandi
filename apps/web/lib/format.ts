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

const VARIETY_LABEL: Record<string, string> = {
  lokwan: 'Lokwan',
  sharbati: 'Sharbati',
  sehore: 'Sehore',
  mp_sihore: 'MP Sihore',
  other: 'Other',
};

export function formatVariety(v: string): string {
  return VARIETY_LABEL[v] ?? v;
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
