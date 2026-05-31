'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@anaaj/ui';
import { GRAIN_VARIETY_SUGGESTIONS, type Grain } from '@anaaj/types';

export function FilterSidebar() {
  const router = useRouter();
  const params = useSearchParams();
  const grain = (params.get('grain') ?? '') as Grain | '';
  const [variety, setVariety] = useState(params.get('variety') ?? '');
  const [minQty, setMinQty] = useState(params.get('min_qty') ?? '');
  const [maxQty, setMaxQty] = useState(params.get('max_qty') ?? '');
  const [minPrice, setMinPrice] = useState(params.get('min_price') ?? '');
  const [maxPrice, setMaxPrice] = useState(params.get('max_price') ?? '');

  const varietyOptions =
    grain && grain in GRAIN_VARIETY_SUGGESTIONS ? GRAIN_VARIETY_SUGGESTIONS[grain as Grain] : [];

  function apply() {
    const next = new URLSearchParams();
    if (grain) next.set('grain', grain);
    if (variety.trim()) next.set('variety', variety.trim());
    if (minQty) next.set('min_qty', minQty);
    if (maxQty) next.set('max_qty', maxQty);
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
    router.push(grain ? `/browse?grain=${grain}` : '/browse');
  }

  const input =
    'block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-wheat-500 focus:outline-none focus:ring-1 focus:ring-wheat-500';
  const label = 'block text-xs font-medium text-neutral-700 mb-1';

  return (
    <aside className="md:sticky md:top-20 space-y-4 rounded-xl border border-neutral-200 bg-white p-4">
      <h3 className="text-sm font-semibold">Filters</h3>

      <div>
        <label className={label}>Variety</label>
        <input
          className={input}
          value={variety}
          onChange={(e) => setVariety(e.target.value)}
          list="variety-suggestions"
          placeholder={grain ? 'Pick or type a variety' : 'Pick a grain first'}
          disabled={!grain}
        />
        {varietyOptions.length > 0 && (
          <datalist id="variety-suggestions">
            {varietyOptions.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        )}
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
            placeholder="6500"
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
