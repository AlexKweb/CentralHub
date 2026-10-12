import { CARD_STEP, COLUMN_SPACING, COLUMN_Y, CHANNEL } from './constants';
import { hash32, mulberry32 } from './rng';
import type { Column, Link, LinkColor, Vec3 } from './types';

export function cardPosition(column: number, row: number): Vec3 {
  return [(column - 2) * COLUMN_SPACING, -row * CARD_STEP + COLUMN_Y[column], 0];
}

const LINK_COLOR_STEPS: readonly [number, LinkColor][] = [
  [0.55, 'white'],
  [0.7, 'pink'],
  [0.82, 'cyan'],
  [0.92, 'lime'],
  [1.0, 'lavender'],
];

function linkColor(r: number): LinkColor {
  for (const [limit, name] of LINK_COLOR_STEPS) {
    if (r < limit) return name;
  }
  return 'lavender';
}

/** Each card links to 3..6 distinct cards of the next column. */
export function links(seed: number, columns: readonly Column[]): Link[] {
  const r = mulberry32(hash32(seed, CHANNEL.LINKS));
  const out: Link[] = [];
  for (let i = 0; i < 4; i++) {
    const dst = columns[i + 1].cards;
    for (const card of columns[i].cards) {
      const n = 3 + Math.floor(r() * 4);
      const used = new Set<number>();
      for (let k = 0; k < n; k++) {
        const ti = Math.floor(r() * dst.length);
        const c = r();
        if (used.has(ti)) continue;
        used.add(ti);
        out.push({ from: card.id, to: dst[ti].id, color: linkColor(c) });
      }
    }
  }
  return out;
}
