import { CHANNEL, hash32, mulberry32 } from '../sim';
import type { Vec3 } from '../sim';
import { bezierPoint } from './curves';
import type { Bezier } from './curves';

export const LINK_PARTICLES = 1500;
export const DUST_PARTICLES = 300;
export const ACTIVE_PARTICLES = 24;

/** Active-path particles advance this many ribbon lengths per second of clock time. */
const ACTIVE_SPEED = 0.6;
/** Render-only sub-seed channel for active-path sizes (see CHANNEL in sim/constants). */
const ACTIVE_CHANNEL = 11;

export interface LinkParticle {
  /** Phase at t = 0, in [0, 1). */
  p: number;
  /** Speed in link lengths per second. */
  s: number;
  sparkle: boolean;
  size: number;
}

/** Draw order p, s, sparkle, size is shared with the Go variant. */
export function particleParams(seed: number, i: number): LinkParticle {
  const r = mulberry32(hash32(seed, CHANNEL.PARTICLES, i));
  const p = r();
  const s = 0.15 + 0.35 * r();
  const sparkle = r() < 0.15;
  const size = sparkle ? 4 + 2 * r() : 2 + 2 * r();
  return { p, s, sparkle, size };
}

export interface DustParticle {
  position: Vec3;
  phase: number;
  size: number;
}

export function dustParams(seed: number, i: number): DustParticle {
  const r = mulberry32(hash32(seed, CHANNEL.DUST, i));
  const x = -9 + 18 * r();
  const y = -19 + 22 * r();
  const z = -0.4 + 2 * r();
  const phase = 2 * Math.PI * r();
  const size = 1.5 + r();
  return { position: [x, y, z], phase, size };
}

export function activeSize(seed: number, k: number): number {
  return 3 + 2 * mulberry32(hash32(seed, ACTIVE_CHANNEL, k))();
}

/** Particle k runs on ribbon k mod N; null when no ribbon is lit. */
export function activeParticleAt(ribbons: readonly Bezier[], k: number, t: number): Vec3 | null {
  if (ribbons.length === 0) return null;
  const u = frac(k / ACTIVE_PARTICLES + ACTIVE_SPEED * t);
  return bezierPoint(ribbons[k % ribbons.length], u);
}

/** Mixes an sRGB colour in 0..1 toward white by `amount`. */
export function towardWhite(rgb: Vec3, amount: number): Vec3 {
  return rgb.map((c) => c + (1 - c) * amount) as Vec3;
}

function frac(x: number): number {
  return x - Math.floor(x);
}
