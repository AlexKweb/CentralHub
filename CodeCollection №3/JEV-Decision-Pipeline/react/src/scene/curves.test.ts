import { describe, expect, it } from 'vitest';
import type { Vec3 } from '../sim';
import { bezierPoint, easeInOutCubic, linkCurve, sampleBezier } from './curves';

const from: Vec3 = [-6, 0.4, 0];
const to: Vec3 = [-3, -1.25, 0];

describe('linkCurve', () => {
  const c = linkCurve(from, to);

  it('starts at the right edge of the source and ends at the left edge of the target', () => {
    expect(c[0]).toEqual([-4.85, 0.4, 0]);
    expect(c[3]).toEqual([-4.15, -1.25, 0]);
    expect(bezierPoint(c, 0)).toEqual(c[0]);
    expect(bezierPoint(c, 1)).toEqual(c[3]);
  });

  it('leaves and enters horizontally', () => {
    expect(c[1][1]).toBe(c[0][1]);
    expect(c[1][0] - c[0][0]).toBeCloseTo(0.9, 12);
    expect(c[2][1]).toBe(c[3][1]);
    expect(c[3][0] - c[2][0]).toBeCloseTo(0.9, 12);
  });
});

describe('sampleBezier', () => {
  it('returns segments + 1 points with both endpoints', () => {
    const pts = sampleBezier(linkCurve(from, to), 24);
    expect(pts).toHaveLength(25);
    expect(pts[0]).toEqual(linkCurve(from, to)[0]);
    expect(pts[24]).toEqual(linkCurve(from, to)[3]);
  });
});

describe('easeInOutCubic', () => {
  it('is 0 at 0, 1 at 1, symmetric about the middle', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBe(0.5);
    expect(easeInOutCubic(0.2) + easeInOutCubic(0.8)).toBeCloseTo(1, 12);
  });
});
