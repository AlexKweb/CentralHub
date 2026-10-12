import { describe, expect, it } from 'vitest';
import { hash32 } from '../sim';
import type { Link, Vec3 } from '../sim';
import { linkField } from './links';

const centers = new Map<string, Vec3>([
  ['a', [-3, 0.5, 0]],
  ['b', [0, -0.75, 0]],
]);

describe('linkField', () => {
  const links: Link[] = [
    { from: 'a', to: 'b', color: 'white' },
    { from: 'a', to: 'b', color: 'pink' },
  ];
  const field = linkField(7, links, centers);

  it('holds 24 segments per link, two vertices each', () => {
    expect(field.positions).toHaveLength(2 * 24 * 2 * 3);
    expect(field.colors).toHaveLength(field.positions.length);
  });

  it('runs from the source right edge to the target left edge', () => {
    const first = Array.from(field.positions.slice(0, 3));
    expect(first[0]).toBeCloseTo(-1.85, 5);
    expect(first[1]).toBeCloseTo(0.5, 5);
    const end = Array.from(field.positions.slice(23 * 6 + 3, 23 * 6 + 6));
    expect(end[0]).toBeCloseTo(-1.15, 5);
    expect(end[1]).toBeCloseTo(-0.75, 5);
  });

  it('gives link i the alpha 0.10 + 0.18·h, h = hash32(seed, 9, i) % 1000 / 1000', () => {
    const alphaOf = (i: number) => 0.1 + 0.18 * ((hash32(7, 9, i) % 1000) / 1000);

    const white = Array.from(field.colors.slice(0, 3));
    expect(white[0]).toBe(white[1]);
    expect(white[0]).toBeCloseTo(alphaOf(0), 6);

    const pink = Array.from(field.colors.slice(24 * 6, 24 * 6 + 3));
    expect(pink[0]).toBeCloseTo(alphaOf(1), 6);
    expect(pink[1] / pink[0]).toBeCloseTo(0x5c / 0xff, 6);
  });

  it('keeps every alpha inside [0.10, 0.28]', () => {
    const many: Link[] = Array.from({ length: 200 }, () => ({ from: 'a', to: 'b', color: 'white' as const }));
    const f = linkField(42, many, centers);
    for (let li = 0; li < many.length; li++) {
      const a = f.colors[li * 24 * 6];
      expect(a).toBeGreaterThanOrEqual(0.1);
      expect(a).toBeLessThanOrEqual(0.28);
    }
  });

  it('is deterministic for a seed', () => {
    expect(linkField(7, links, centers)).toEqual(field);
  });
});
