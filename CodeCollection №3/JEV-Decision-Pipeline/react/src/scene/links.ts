import { hash32 } from '../sim';
import type { Link, LinkColor, Vec3 } from '../sim';
import { linkCurve, sampleBezier } from './curves';
import type { LineField } from './grid';

const SEGMENTS = 24;
/** Render-only sub-seed channel (see CHANNEL in sim/constants). */
const ALPHA_CHANNEL = 9;

const RGB: Record<LinkColor, Vec3> = {
  white: [1, 1, 1],
  pink: [0xff / 255, 0x5c / 255, 0x8a / 255],
  cyan: [0x4f / 255, 0xd1 / 255, 0xe8 / 255],
  lime: [0xc6 / 255, 0xf2 / 255, 0x3a / 255],
  lavender: [0xa9 / 255, 0x9b / 255, 0xff / 255],
};

/** One batch for every link. Colours are premultiplied by alpha because additive blending ignores it. */
export function linkField(seed: number, links: readonly Link[], centers: ReadonlyMap<string, Vec3>): LineField {
  const positions = new Float32Array(links.length * SEGMENTS * 6);
  const colors = new Float32Array(links.length * SEGMENTS * 6);
  links.forEach((link, li) => {
    const from = centers.get(link.from);
    const to = centers.get(link.to);
    if (!from || !to) throw new Error(`link: unknown card ${!from ? link.from : link.to}`);
    const alpha = 0.25 + 0.25 * (hash32(seed, ALPHA_CHANNEL, li) / 0x100000000);
    const rgb = RGB[link.color].map((c) => c * alpha);
    const pts = sampleBezier(linkCurve(from, to), SEGMENTS);
    for (let s = 0; s < SEGMENTS; s++) {
      const o = (li * SEGMENTS + s) * 6;
      positions.set(pts[s], o);
      positions.set(pts[s + 1], o + 3);
      colors.set(rgb, o);
      colors.set(rgb, o + 3);
    }
  });
  return { positions, colors };
}
