import type { Card, Rgb } from '../sim';

export interface CardRow {
  k: string;
  v: string;
  hl: boolean;
}

/** Everything a card texture depends on: equal keys draw equal textures. */
export interface CardView {
  title: string;
  color: string;
  rows: CardRow[];
  lit: boolean;
  accent: Rgb | null;
  plate: string | null;
}

function isHead(id: string): boolean {
  return id.startsWith('j.') && id.endsWith('_head');
}

export function cardView(
  card: Card,
  color: string,
  lit: boolean,
  accent: Rgb,
  plate: string | null,
  liveConfidence: string,
): CardView {
  const showLive = lit && isHead(card.id);
  return {
    title: card.title,
    color,
    rows: card.rows.map((row) => ({
      k: row.k,
      v: showLive && row.k === 'confidence' ? liveConfidence : row.v,
      hl: row.hl === true,
    })),
    lit,
    accent: lit ? accent : null,
    plate: lit ? plate : null,
  };
}

export function cardKey(view: CardView): string {
  return JSON.stringify(view);
}
