import type { Vec3 } from '../sim';
import { CARD_W } from './layout';

export type Bezier = [Vec3, Vec3, Vec3, Vec3];

const EDGE = CARD_W / 2;
const HANDLE = 0.9;

/** Cubic from the right edge of the `from` card to the left edge of the `to` card, with horizontal tangents. */
export function linkCurve(from: Vec3, to: Vec3): Bezier {
  return [
    [from[0] + EDGE, from[1], 0],
    [from[0] + EDGE + HANDLE, from[1], 0],
    [to[0] - EDGE - HANDLE, to[1], 0],
    [to[0] - EDGE, to[1], 0],
  ];
}

export function bezierPoint(c: Bezier, s: number): Vec3 {
  const u = 1 - s;
  const w = [u * u * u, 3 * u * u * s, 3 * u * s * s, s * s * s];
  return [0, 1, 2].map((i) => w[0] * c[0][i] + w[1] * c[1][i] + w[2] * c[2][i] + w[3] * c[3][i]) as Vec3;
}

/** `segments + 1` points at even parameter steps, both endpoints included. */
export function sampleBezier(c: Bezier, segments: number): Vec3[] {
  return Array.from({ length: segments + 1 }, (_, i) => bezierPoint(c, i / segments));
}

export function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}
