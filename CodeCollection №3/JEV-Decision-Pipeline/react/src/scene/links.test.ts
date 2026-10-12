import { describe, expect, it } from 'vitest';
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

  it('gives each link one alpha in [0.25, 0.5] and keeps the hue', () => {
    const white = Array.from(field.colors.slice(0, 3));
    expect(white[0]).toBe(white[1]);
    expect(white[0]).toBeGreaterThanOrEqual(0.25);
    expect(white[0]).toBeLessThanOrEqual(0.5);

    const pink = Array.from(field.colors.slice(24 * 6, 24 * 6 + 3));
    expect(pink[1] / pink[0]).toBeCloseTo(0x5c / 0xff, 6);
    expect(pink[0]).toBeGreaterThanOrEqual(0.25);
    expect(pink[0]).toBeLessThanOrEqual(0.5);
  });

  it('is deterministic for a seed', () => {
    expect(linkField(7, links, centers)).toEqual(field);
  });
});
