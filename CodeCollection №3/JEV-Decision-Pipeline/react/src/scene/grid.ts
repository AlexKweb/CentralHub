import type { Vec3 } from '../sim';

export interface LineField {
  positions: Float32Array;
  colors: Float32Array;
}

const BG: Vec3 = [5 / 255, 7 / 255, 11 / 255];
const LINE: Vec3 = [0x1a / 255, 0x21 / 255, 0x30 / 255];

const WALL = { x0: -8, x1: 8, y0: -18, y1: 3, z: -1.2 };
const FLOOR = { y: -17.6, x0: -8, x1: 8, z0: -12, dash: 0.4 };

/** Vertices fade towards the background with distance from `center`, so no alpha blending is needed. */
function lineField(segments: [Vec3, Vec3][], center: Vec3, radius: number, strength: number): LineField {
  const positions = new Float32Array(segments.length * 6);
  const colors = new Float32Array(segments.length * 6);
  segments.forEach(([a, b], i) => {
    [a, b].forEach((p, j) => {
      const o = i * 6 + j * 3;
      const d = Math.hypot(p[0] - center[0], p[1] - center[1], p[2] - center[2]);
      const k = strength * Math.max(0, 1 - d / radius);
      positions.set(p, o);
      for (let c = 0; c < 3; c++) colors[o + c] = BG[c] + (LINE[c] - BG[c]) * k;
    });
  });
  return { positions, colors };
}

export function wallField(): LineField {
  const segments: [Vec3, Vec3][] = [];
  for (let x = WALL.x0; x <= WALL.x1; x++) segments.push([[x, WALL.y0, WALL.z], [x, WALL.y1, WALL.z]]);
  for (let y = WALL.y0; y <= WALL.y1; y++) segments.push([[WALL.x0, y, WALL.z], [WALL.x1, y, WALL.z]]);
  return lineField(segments, [0, (WALL.y0 + WALL.y1) / 2, WALL.z], 22, 1);
}

export function floorField(): LineField {
  const segments: [Vec3, Vec3][] = [];
  for (let x = FLOOR.x0; x <= FLOOR.x1; x++) {
    for (let z = FLOOR.z0; z < 0; z++) segments.push([[x, FLOOR.y, z], [x, FLOOR.y, z + FLOOR.dash]]);
  }
  return lineField(segments, [0, FLOOR.y, -6], 16, 0.5);
}
