'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@anaaj/ui';

const VARIETIES = [
  { value: '', label: 'All varieties' },
  { value: 'lokwan', label: 'Lokwan' },
  { value: 'sharbati', label: 'Sharbati' },
  { value: 'sehore', label: 'Sehore' },
  { value: 'mp_sihore', label: 'MP Sihore' },
];

export function FilterSidebar() {
  const router = useRouter();
  const params = useSearchParams();
  const [variety, setVariety] = useState(params.get('variety') ?? '');
  const [minQty, setMinQty] = useState(params.get('min_qty') ?? '');
  const [maxQty, setMaxQty] = useState(params.get('max_qty') ?? '');
  const [minPrice, setMinPrice] = useState(params.get('min_price') ?? '');
  const [maxPrice, setMaxPrice] = useState(params.get('max_price') ?? '');

  function apply() {
    const next = new URLSearchParams();
    if (variety) next.set('variety', variety);
    if (minQty) next.set('min_qty', minQty);
    if (maxQty) next.set('max_qty', maxQty);
    // price filters are entered in ₹; convert to paise for the API
    if (minPrice) next.set('min_price', String(Number(minPrice) * 100));
    if (maxPrice) next.set('max_price', String(Number(maxPrice) * 100));
    router.push(`/browse?${next.toString()}`);
  }

  function reset() {
    setVariety('');
    setMinQty('');
    setMaxQty('');
    setMinPrice('');
    setMaxPrice('');
    router.push('/browse');
  }

  const input =
    'block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-wheat-500 focus:outline-none focus:ring-1 focus:ring-wheat-500';
  const label = 'block text-xs font-medium text-neutral-700 mb-1';

  return (
    <aside className="sticky top-20 space-y-4 rounded-xl border border-neutral-200 bg-white p-4">
      <h3 className="text-sm font-semibold">Filters</h3>

      <div>
        <label className={label}>Variety</label>
        <select className={input} value={variety} onChange={(e) => setVariety(e.target.value)}>
          {VARIETIES.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={label}>Min qty (qtl)</label>
          <input
            className={input}
            inputMode="numeric"
            value={minQty}
            onChange={(e) => setMinQty(e.target.value)}
            placeholder="10"
          />
        </div>
        <div>
          <label className={label}>Max qty (qtl)</label>
          <input
            className={input}
            inputMode="numeric"
            value={maxQty}
            onChange={(e) => setMaxQty(e.target.value)}
            placeholder="500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={label}>Min ₹/qtl</label>
          <input
            className={input}
            inputMode="numeric"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="2400"
          />
        </div>
        <div>
          <label className={label}>Max ₹/qtl</label>
          <input
            className={input}
            inputMode="numeric"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="3500"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={apply} className="flex-1">
          Apply
        </Button>
        <Button size="sm" variant="ghost" onClick={reset}>
          Reset
        </Button>
      </div>
    </aside>
  );
}
