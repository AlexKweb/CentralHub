import { describe, expect, it } from 'vitest';
import type { Card } from '../sim';
import { cardKey, cardView } from './cardView';

const head: Card = {
  id: 'j.choice_head',
  title: 'choice head',
  rows: [
    { k: 'picks', v: 'one label' },
    { k: 'confidence', v: '0.93', hl: true },
    { k: 'prose', v: 'none' },
  ],
};
const ACCENT = [255, 92, 92] as const;

describe('cardView', () => {
  it('shows the live case confidence on a lit head card only', () => {
    const lit = cardView(head, '#A99BFF', true, [...ACCENT], '→ phishing · 0.97', '0.97');
    const dark = cardView(head, '#A99BFF', false, [...ACCENT], null, '0.97');
    expect(lit.rows[1]).toEqual({ k: 'confidence', v: '0.97', hl: true });
    expect(dark.rows[1].v).toBe('0.93');
  });

  it('changes the key only with visible state', () => {
    const base = cardView(head, '#A99BFF', true, [...ACCENT], 'plate', '0.97');
    expect(cardKey(base)).toBe(cardKey(cardView(head, '#A99BFF', true, [...ACCENT], 'plate', '0.97')));
    expect(cardKey(base)).not.toBe(cardKey(cardView(head, '#A99BFF', true, [...ACCENT], null, '0.97')));
    const unlitA = cardView(head, '#A99BFF', false, [1, 2, 3], null, '0.97');
    const unlitB = cardView(head, '#A99BFF', false, [9, 9, 9], null, '0.11');
    expect(cardKey(unlitA)).toBe(cardKey(unlitB));
  });
});
