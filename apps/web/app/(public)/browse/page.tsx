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

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const query = new URLSearchParams();
  for (const key of ['variety', 'min_qty', 'max_qty', 'min_price', 'max_price', 'page']) {
    const v = readParam(searchParams[key]);
    if (v) query.set(key, v);
  }
  query.set('limit', '24');

  let data: ListResponse | null = null;
  let error: string | null = null;
  try {
    data = await apiFetch<ListResponse>(`/lots?${query.toString()}`, { cache: 'no-store' });
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load lots';
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Browse wheat lots</h1>
        <p className="text-sm text-neutral-600">
          {data
            ? `${data.pagination.total} active ${data.pagination.total === 1 ? 'lot' : 'lots'} ka stock available`
            : 'Loading…'}
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        {/* Filter sidebar — collapses above the grid on mobile */}
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
