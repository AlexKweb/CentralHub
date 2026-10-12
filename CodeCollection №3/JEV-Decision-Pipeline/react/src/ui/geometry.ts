import type { CSSProperties } from 'react';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Logical frame size; the whole UI is laid out in these px and scaled to the viewport. */
export const FRAME = { w: 1240, h: 1568 };

/** SPEC §3 zone geometry. */
export const ZONES = {
  header: { x: 14, y: 16, w: 1214, h: 32 },
  kpi: { x: 14, y: 58, w: 1214, h: 130 },
  'kpi-decisions': { x: 14, y: 58, w: 296, h: 130 },
  'kpi-latency': { x: 320, y: 58, w: 296, h: 130 },
  'kpi-cost': { x: 626, y: 58, w: 296, h: 130 },
  'kpi-confidence': { x: 932, y: 58, w: 296, h: 130 },
  case: { x: 14, y: 196, w: 1214, h: 66 },
  scene: { x: 0, y: 262, w: 1240, h: 918 },
  'panel-parallel': { x: 14, y: 1186, w: 298, h: 210 },
  'panel-stream': { x: 322, y: 1186, w: 290, h: 210 },
  'panel-cases': { x: 626, y: 1186, w: 294, h: 210 },
  'panel-chief': { x: 932, y: 1186, w: 296, h: 210 },
  'panel-runlog': { x: 14, y: 1404, w: 484, h: 120 },
  'panel-split': { x: 506, y: 1404, w: 364, h: 120 },
  'panel-guardrails': { x: 878, y: 1404, w: 350, h: 120 },
  footer: { x: 14, y: 1532, w: 1214, h: 36 },
} satisfies Record<string, Rect>;

export type ZoneName = keyof typeof ZONES;

export function rectStyle(r: Rect): CSSProperties {
  return { left: r.x, top: r.y, width: r.w, height: r.h };
}
