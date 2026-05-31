import { apiFetch, type PriceTickItem } from '@/lib/api';
import { formatGrain, formatMandi, formatRupees, formatVariety, grainEmoji } from '@/lib/format';

interface PricesResponse {
  items: PriceTickItem[];
  source: 'db' | 'cache';
}

export async function PriceTicker() {
  let data: PricesResponse | null = null;
  try {
    data = await apiFetch<PricesResponse>('/prices/today', { revalidate: 300 });
  } catch {
    /* graceful empty state */
  }

  // Bucket by grain so the strip is readable: each grain gets its own row.
  const byGrain = new Map<string, PriceTickItem[]>();
  if (data) {
    for (const t of data.items) {
      const arr = byGrain.get(t.grain) ?? [];
      arr.push(t);
      byGrain.set(t.grain, arr);
    }
  }

  return (
    <section className="border-y border-wheat-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-3 md:py-4">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-wheat-600 uppercase md:text-base">
            Aaj ka Mandi rate
          </h2>
          <span className="text-xs text-neutral-500">
            {data?.source === 'cache' ? 'cached' : 'live'} · login nahi chahiye
          </span>
        </div>
        {!data || data.items.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Prices not available right now — check back soon.
          </p>
        ) : (
          <div className="space-y-2">
            {Array.from(byGrain.entries()).map(([grain, ticks]) => (
              <div key={grain}>
                <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
                  <span aria-hidden>{grainEmoji(grain)}</span>
                  <span>{formatGrain(grain)}</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {ticks.map((t) => (
                    <div
                      key={t._id}
                      className="min-w-[170px] flex-shrink-0 rounded-lg border border-wheat-100 bg-wheat-50 px-3 py-2"
                    >
                      <div className="text-[10px] font-medium uppercase tracking-wide text-wheat-600">
                        {formatMandi(t.mandi)} · {formatVariety(t.variety)}
                      </div>
                      <div className="mt-0.5 text-base font-semibold text-neutral-900">
                        {formatRupees(t.price_modal)}
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        {formatRupees(t.price_min)} – {formatRupees(t.price_max)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
