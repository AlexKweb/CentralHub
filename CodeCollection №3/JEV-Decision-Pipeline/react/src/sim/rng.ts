/**
 * FNV-1a over the little-endian bytes of each value, then murmur3 fmix32.
 * Math.imul keeps the products in 32 bits; `>>> 0` returns the unsigned value.
 */
export function hash32(...values: number[]): number {
  let h = 0x811c9dc5;
  for (const value of values) {
    const v = value >>> 0;
    for (let shift = 0; shift < 32; shift += 8) {
      h = Math.imul(h ^ ((v >>> shift) & 0xff), 0x01000193) >>> 0;
    }
  }
  h = (h ^ (h >>> 16)) >>> 0;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/** Returns a generator of floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a) >>> 0;
    t = ((((t + Math.imul(t ^ (t >>> 7), 61 | t)) >>> 0) ^ t) >>> 0);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
