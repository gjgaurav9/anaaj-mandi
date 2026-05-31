import Link from 'next/link';
import { GRAIN_EMOJI, GRAIN_LABELS, GrainSchema, type Grain } from '@anaaj/types';
import { apiFetch, type LotListItem } from '@/lib/api';
import { LotCard } from '@/components/LotCard';
import { FilterSidebar } from '@/components/FilterSidebar';

interface BrowsePageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

interface ListResponse {
  items: LotListItem[];
  pagination: { page: number; limit: number; total: number; has_more: boolean };
}

function readParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

const GRAIN_PILLS: Array<{ id: Grain | 'all'; label: string }> = [
  { id: 'all', label: 'All grains' },
  ...GrainSchema.options
    .filter((g) => g !== 'other')
    .map((g) => ({ id: g, label: GRAIN_LABELS[g] })),
];

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const query = new URLSearchParams();
  for (const key of ['grain', 'variety', 'min_qty', 'max_qty', 'min_price', 'max_price', 'page']) {
    const v = readParam(searchParams[key]);
    if (v) query.set(key, v);
  }
  query.set('limit', '24');

  const grain = readParam(searchParams.grain);
  const grainLabel =
    grain && GRAIN_LABELS[grain as Grain] ? GRAIN_LABELS[grain as Grain] : 'All grains';
  const grainIcon = grain && GRAIN_EMOJI[grain as Grain] ? GRAIN_EMOJI[grain as Grain] : '🌱';

  let data: ListResponse | null = null;
  let error: string | null = null;
  try {
    data = await apiFetch<ListResponse>(`/lots?${query.toString()}`, { cache: 'no-store' });
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load lots';
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <header className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          <span className="mr-2" aria-hidden>
            {grainIcon}
          </span>
          {grain ? `Browse ${grainLabel}` : 'Browse all grain lots'}
        </h1>
        <p className="text-sm text-neutral-600">
          {data
            ? `${data.pagination.total} active ${data.pagination.total === 1 ? 'lot' : 'lots'} ka stock available`
            : 'Loading…'}
        </p>
      </header>

      {/* Grain pills — quick switch without going back to landing */}
      <nav
        aria-label="Filter by grain"
        className="mb-5 flex flex-wrap gap-1.5 overflow-x-auto pb-1"
      >
        {GRAIN_PILLS.map((p) => {
          const active = (p.id === 'all' && !grain) || p.id === grain;
          const href = p.id === 'all' ? '/browse' : `/browse?grain=${p.id}`;
          return (
            <Link
              key={p.id}
              href={href}
              className={`flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                active
                  ? 'bg-wheat-500 text-white'
                  : 'bg-white text-neutral-700 ring-1 ring-neutral-200 hover:bg-wheat-50'
              }`}
            >
              {p.id !== 'all' && <span aria-hidden>{GRAIN_EMOJI[p.id as Grain]}</span>}
              {p.label}
            </Link>
          );
        })}
      </nav>

      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        <FilterSidebar />
        <section>
          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500">
              No lots match your filters yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((lot) => (
                <LotCard key={lot._id} lot={lot} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
