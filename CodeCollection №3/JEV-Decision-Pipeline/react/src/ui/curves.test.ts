import { describe, expect, it } from 'vitest';
import { curvePoints, valueY } from './curves';

describe('curvePoints', () => {
  it('maps yMin to the bottom edge and yMax to the top edge', () => {
    expect(curvePoints([0.55, 1.05], 100, 100, 0.55, 1.05)).toBe('0.00,100.00 100.00,0.00');
  });

  it('spreads samples evenly across the width', () => {
    const xs = curvePoints([0.8, 0.8, 0.8], 10, 10, 0.55, 1.05)
      .split(' ')
      .map((p) => Number(p.split(',')[0]));
    expect(xs).toEqual([0, 5, 10]);
  });
});

describe('valueY', () => {
  it('puts the 0.85 gate 40% down a 0.55–1.05 scale', () => {
    expect(valueY(0.85, 100, 0.55, 1.05)).toBeCloseTo(40);
  });
});
