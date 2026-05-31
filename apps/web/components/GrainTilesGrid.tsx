import Link from 'next/link';
import { GRAIN_EMOJI, GRAIN_LABELS, GrainSchema } from '@anaaj/types';

/**
 * Public grain selector. Renders the 8 supported grains (skips 'other')
 * as a responsive grid; tapping a tile lands on /browse?grain=<id>.
 */
const TILES = GrainSchema.options.filter((g) => g !== 'other');

interface GrainCounts {
  /** Optional: number of active lots per grain to show under the label. */
  counts?: Partial<Record<string, number>>;
}

export function GrainTilesGrid({ counts }: GrainCounts) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {TILES.map((g) => {
        const count = counts?.[g];
        return (
          <Link
            key={g}
            href={`/browse?grain=${g}`}
            className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white p-4 text-center transition hover:-translate-y-0.5 hover:border-wheat-400 hover:bg-wheat-50 hover:shadow-md"
          >
            <span className="text-3xl leading-none md:text-4xl">{GRAIN_EMOJI[g]}</span>
            <span className="text-sm font-semibold text-neutral-800 md:text-base">
              {GRAIN_LABELS[g]}
            </span>
            <span className="text-[11px] text-neutral-500">
              {count === undefined
                ? 'View lots →'
                : count === 0
                  ? 'No active lots'
                  : `${count} active ${count === 1 ? 'lot' : 'lots'}`}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
