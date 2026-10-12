import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

declare global {
  interface Window {
    __jev?: {
      ready: boolean;
      state: () => { case: number; stage: string; t: number; paused: boolean };
    };
  }
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const REPORT_DIR = fileURLToPath(new URL('./report/', import.meta.url));
const TOLERANCE_PX = 8;

// SPEC §3, logical px.
const EXPECTED: Record<string, Box> = {
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
};

const FRAMES = [
  { id: 'F1', t: 7.6, caseNumber: 1, stage: 'code' },
  { id: 'F2', t: 13.68, caseNumber: 2, stage: 'gate' },
  { id: 'F3', t: 58.48, caseNumber: 8, stage: 'ask' },
  { id: 'F4', t: 28.08, caseNumber: 4, stage: 'jev' },
] as const;

async function readZoneBoxes(page: Page): Promise<Record<string, Box>> {
  return page.evaluate(() => {
    const frame = document.querySelector<HTMLElement>('[data-frame]');
    if (!frame) throw new Error('frame element missing');
    const origin = frame.getBoundingClientRect();
    const scale = origin.width / 1240;
    const boxes: Record<string, { x: number; y: number; w: number; h: number }> = {};
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('[data-zone]'))) {
      const r = el.getBoundingClientRect();
      boxes[el.dataset.zone ?? ''] = {
        x: (r.left - origin.left) / scale,
        y: (r.top - origin.top) / scale,
        w: r.width / scale,
        h: r.height / scale,
      };
    }
    return boxes;
  });
}

for (const frame of FRAMES) {
  test(`${frame.id}: t=${frame.t} shows case ${frame.caseNumber} ${frame.stage}`, async ({ page }) => {
    const consoleErrors: string[] = [];
    const foreignRequests: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));
    page.on('request', (req) => {
      const { hostname } = new URL(req.url());
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') foreignRequests.push(req.url());
    });

    await page.goto(`/?seed=1&paused=1&t=${frame.t}`);
    await page.waitForFunction(() => window.__jev?.ready === true);

    const state = await page.evaluate(() => window.__jev?.state());
    expect(state).toEqual({ case: frame.caseNumber, stage: frame.stage, t: frame.t, paused: true });

    const boxes = await readZoneBoxes(page);
    for (const [zone, want] of Object.entries(EXPECTED)) {
      const got = boxes[zone] ?? { x: NaN, y: NaN, w: NaN, h: NaN };
      expect(Math.abs(got.x - want.x), `${zone} x`).toBeLessThanOrEqual(TOLERANCE_PX);
      expect(Math.abs(got.y - want.y), `${zone} y`).toBeLessThanOrEqual(TOLERANCE_PX);
      expect(Math.abs(got.w - want.w), `${zone} w`).toBeLessThanOrEqual(TOLERANCE_PX);
      expect(Math.abs(got.h - want.h), `${zone} h`).toBeLessThanOrEqual(TOLERANCE_PX);
    }

    expect(consoleErrors, 'console errors').toEqual([]);
    expect(foreignRequests, 'non-localhost requests').toEqual([]);
    await expect(page).toHaveScreenshot(`react-${frame.id}.png`, { maxDiffPixelRatio: 0.02 });

    mkdirSync(REPORT_DIR, { recursive: true });
    await page.screenshot({ path: join(REPORT_DIR, `react-${frame.id}.png`) });
  });
}
