import cardsJson from '@shared/cards.json';
import { cardPosition } from '../sim';
import type { CardsDoc, Column, Vec3 } from '../sim';

/** World units; card textures are drawn at 100 px per unit. */
export const CARD_W = 2.3;
export const CARD_H = 1;
/** Transparent margin around a card plane, so the lit glow is not clipped. */
export const CARD_MARGIN = 0.12;
export const CARD_PLANE: [number, number] = [CARD_W + 2 * CARD_MARGIN, CARD_H + 2 * CARD_MARGIN];
export const HEADER_PLANE: [number, number] = [CARD_W, 0.5];

export const cardsDoc = cardsJson as CardsDoc;

/** Card centres by id; the camera targets these. */
export function cardCenters(columns: readonly Column[]): Map<string, Vec3> {
  const out = new Map<string, Vec3>();
  columns.forEach((column, ci) => column.cards.forEach((card, row) => out.set(card.id, cardPosition(ci, row))));
  return out;
}

/** A column header sits just above the first card of its column. */
export function headerPosition(column: number): Vec3 {
  const [x, y] = cardPosition(column, 0);
  return [x, y + CARD_H / 2 + 0.2 + HEADER_PLANE[1] / 2, 0];
}
