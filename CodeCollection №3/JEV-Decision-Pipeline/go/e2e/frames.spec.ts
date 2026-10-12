import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const frames = [
  { id: 'F1', t: 7.6, caseNo: 1, stage: 'code' },
  { id: 'F2', t: 13.68, caseNo: 2, stage: 'gate' },
  { id: 'F3', t: 58.48, caseNo: 8, stage: 'ask' },
  { id: 'F4', t: 28.08, caseNo: 4, stage: 'jev' },
];

// SPEC §3 edges in logical px; each zone from layout() must sit within ±8 px.
const spec: Record<string, { top: number; bottom: number; left?: number; right?: number }> = {
  header: { top: 16, bottom: 48 },
  kpi0: { top: 58, bottom: 188, left: 14, right: 310 },
  kpi1: { top: 58, bottom: 188, left: 320, right: 616 },
  kpi2: { top: 58, bottom: 188, left: 626, right: 922 },
  kpi3: { top: 58, bottom: 188, left: 932, right: 1228 },
  case: { top: 196, bottom: 262 },
  scene: { top: 262, bottom: 1180 },
  parallel: { top: 1186, bottom: 1396, left: 14, right: 312 },
  confidence: { top: 1186, bottom: 1396, left: 322, right: 612 },
  useCases: { top: 1186, bottom: 1396, left: 626, right: 920 },
  chief: { top: 1186, bottom: 1396, left: 932, right: 1228 },
  runLog: { top: 1404, bottom: 1524, left: 14, right: 498 },
  split: { top: 1404, bottom: 1524, left: 506, right: 870 },
  guardrails: { top: 1404, bottom: 1524, left: 878, right: 1228 },
  footer: { top: 1532, bottom: 1568 },
};

for (const f of frames) {
  test(`${f.id}: t=${f.t} shows case ${f.caseNo} ${f.stage}`, async ({ page }) => {
    test.setTimeout(120_000);
    const problems: string[] = [];
    const external: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') problems.push(msg.text());
    });
    page.on('pageerror', (err) => problems.push(err.message));
    page.on('request', (req) => {
      const url = new URL(req.url());
      if (url.protocol !== 'data:' && url.protocol !== 'blob:' && !['localhost', '127.0.0.1'].includes(url.hostname)) {
        external.push(req.url());
      }
    });

    await page.goto(`/?seed=1&paused=1&t=${f.t}`);
    await page.waitForFunction(() => (window as any).__jev?.ready === true, undefined, { timeout: 60_000 });

    const state = await page.evaluate(() => (window as any).__jev.state());
    expect(state).toMatchObject({ case: f.caseNo, stage: f.stage, paused: true });
    expect(state.t).toBeCloseTo(f.t, 9);

    const layout: Record<string, { x: number; y: number; w: number; h: number }> = await page.evaluate(() =>
      (window as any).__jev.layout(),
    );
    for (const [name, want] of Object.entries(spec)) {
      const z = layout[name];
      expect(z, name).toBeDefined();
      expect(Math.abs(z.y - want.top), `${name} top`).toBeLessThanOrEqual(8);
      expect(Math.abs(z.y + z.h - want.bottom), `${name} bottom`).toBeLessThanOrEqual(8);
      if (want.left !== undefined) expect(Math.abs(z.x - want.left), `${name} left`).toBeLessThanOrEqual(8);
      if (want.right !== undefined) expect(Math.abs(z.x + z.w - want.right), `${name} right`).toBeLessThanOrEqual(8);
    }

    fs.mkdirSync(path.join(__dirname, 'report'), { recursive: true });
    await page.screenshot({ path: path.join(__dirname, 'report', `go-${f.id}.png`) });
    await expect(page).toHaveScreenshot(`go-${f.id}.png`, { maxDiffPixelRatio: 0.02, timeout: 60_000 });

    expect(problems, 'console errors').toEqual([]);
    expect(external, 'non-localhost requests').toEqual([]);
  });
}

test('fx=0 renders the plain scene with no console errors', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(msg.text());
  });
  page.on('pageerror', (err) => problems.push(err.message));

  await page.goto('/?seed=1&paused=1&t=7.6&fx=0');
  await page.waitForFunction(() => (window as any).__jev?.ready === true, undefined, { timeout: 60_000 });

  const state = await page.evaluate(() => (window as any).__jev.state());
  expect(state).toMatchObject({ case: 1, stage: 'code', paused: true });
  expect(problems, 'console errors').toEqual([]);
});

// Share of pixels that differ between two PNG screenshots, decoded in the page so no image library is needed.
async function diffRatio(page: Page, a: Buffer, b: Buffer): Promise<number> {
  return page.evaluate(async ([pa, pb]) => {
    const pixels = async (b64: string) => {
      const bmp = await createImageBitmap(await (await fetch(`data:image/png;base64,${b64}`)).blob());
      const ctx = new OffscreenCanvas(bmp.width, bmp.height).getContext('2d')!;
      ctx.drawImage(bmp, 0, 0);
      return { w: bmp.width, h: bmp.height, data: ctx.getImageData(0, 0, bmp.width, bmp.height).data };
    };
    const x = await pixels(pa);
    const y = await pixels(pb);
    let n = 0;
    for (let i = 0; i < x.data.length; i += 4) {
      if (x.data[i] !== y.data[i] || x.data[i + 1] !== y.data[i + 1] || x.data[i + 2] !== y.data[i + 2] || x.data[i + 3] !== y.data[i + 3]) n++;
    }
    return n / (x.w * x.h);
  }, [a.toString('base64'), b.toString('base64')]);
}

test('paused frame is a pure function of t: screenshots 1 s apart differ by < 0.1% of pixels', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/?seed=1&paused=1&t=7.6');
  await page.waitForFunction(() => (window as any).__jev?.ready === true, undefined, { timeout: 60_000 });

  const first = await page.screenshot();
  await page.waitForTimeout(1000);
  const second = await page.screenshot();

  expect(await diffRatio(page, first, second)).toBeLessThan(0.001);
});
