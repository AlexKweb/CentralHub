import { describe, expect, it } from 'vitest';
import type { Vec3 } from '../sim';
import { bezierPoint, linkCurve } from './curves';
import {
  ACTIVE_PARTICLES,
  DUST_PARTICLES,
  LINK_PARTICLES,
  activeParticleAt,
  activeSize,
  dustParams,
  particleParams,
  towardWhite,
} from './particles';

function expectNear(actual: Vec3 | null, expected: Vec3): void {
  expect(actual).not.toBeNull();
  actual!.forEach((c, i) => expect(c).toBeCloseTo(expected[i], 9));
}

describe('particleParams', () => {
  it('is deterministic in seed and index', () => {
    expect(particleParams(1, 42)).toEqual(particleParams(1, 42));
    expect(particleParams(2, 42)).not.toEqual(particleParams(1, 42));
  });

  it('keeps phase, speed and size inside the spec ranges', () => {
    for (let i = 0; i < LINK_PARTICLES; i++) {
      const { p, s, sparkle, size } = particleParams(1, i);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThan(1);
      expect(s).toBeGreaterThanOrEqual(0.15);
      expect(s).toBeLessThanOrEqual(0.5);
      const [lo, hi] = sparkle ? [4, 6] : [2, 4];
      expect(size).toBeGreaterThanOrEqual(lo);
      expect(size).toBeLessThanOrEqual(hi);
    }
  });

  it('marks about 15 % of particles as sparkles', () => {
    const sparkles = Array.from({ length: LINK_PARTICLES }, (_, i) => particleParams(1, i)).filter((p) => p.sparkle);
    expect(sparkles.length / LINK_PARTICLES).toBeGreaterThan(0.1);
    expect(sparkles.length / LINK_PARTICLES).toBeLessThan(0.2);
  });
});

describe('dustParams', () => {
  it('places every mote inside the spec box with a phase and size in range', () => {
    for (let i = 0; i < DUST_PARTICLES; i++) {
      const { position: [x, y, z], phase, size } = dustParams(1, i);
      expect(x).toBeGreaterThanOrEqual(-9);
      expect(x).toBeLessThanOrEqual(9);
      expect(y).toBeGreaterThanOrEqual(-19);
      expect(y).toBeLessThanOrEqual(3);
      expect(z).toBeGreaterThanOrEqual(-0.4);
      expect(z).toBeLessThanOrEqual(1.6);
      expect(phase).toBeGreaterThanOrEqual(0);
      expect(phase).toBeLessThanOrEqual(2 * Math.PI);
      expect(size).toBeGreaterThanOrEqual(1.5);
      expect(size).toBeLessThanOrEqual(2.5);
    }
  });
});

describe('activeParticleAt', () => {
  const a = linkCurve([-3, 0, 0], [0, 0, 0]);
  const b = linkCurve([0, 0, 0], [3, 1, 0]);

  it('is null without a lit ribbon', () => {
    expect(activeParticleAt([], 0, 1)).toBeNull();
  });

  it('places particle k at u = k/24 + 0.6 t on ribbon k mod N', () => {
    expectNear(activeParticleAt([a], 5, 0), bezierPoint(a, 5 / ACTIVE_PARTICLES));
    expectNear(activeParticleAt([a, b], 4, 0), bezierPoint(a, 4 / ACTIVE_PARTICLES));
    expectNear(activeParticleAt([a, b], 5, 0), bezierPoint(b, 5 / ACTIVE_PARTICLES));
  });

  it('wraps the phase back onto the same point after one full cycle', () => {
    expectNear(activeParticleAt([a], 3, 1 / 0.6), bezierPoint(a, 3 / ACTIVE_PARTICLES));
  });
});

describe('colour and size helpers', () => {
  it('mixes toward white by the given amount', () => {
    expect(towardWhite([0, 0.5, 1], 0.4)).toEqual([expect.closeTo(0.4), expect.closeTo(0.7), 1]);
  });

  it('keeps active-path sizes in 3–5 px', () => {
    for (let k = 0; k < ACTIVE_PARTICLES; k++) {
      const size = activeSize(1, k);
      expect(size).toBeGreaterThanOrEqual(3);
      expect(size).toBeLessThanOrEqual(5);
    }
  });
});
