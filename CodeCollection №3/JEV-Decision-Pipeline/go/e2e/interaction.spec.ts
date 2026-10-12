import { test, expect, type Page } from '@playwright/test';

type Rect = { x: number; y: number; w: number; h: number };
type State = { case: number; stage: string; t: number; paused: boolean; fx: boolean };

const state = (page: Page) => page.evaluate(() => (window as any).__jev.state()) as Promise<State>;
const layout = (page: Page) => page.evaluate(() => (window as any).__jev.layout()) as Promise<Record<string, Rect>>;

// Loads the page and records console errors and uncaught exceptions for the whole test.
async function open(page: Page, query: string) {
  const problems: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(msg.text());
  });
  page.on('pageerror', (err) => problems.push(err.message));
  await page.goto(`/?${query}`);
  await page.waitForFunction(() => (window as any).__jev?.ready === true, undefined, { timeout: 60_000 });
  return problems;
}

// Ebitengine samples input once per tick, and the sandbox's software renderer ticks about 5 times a second,
// so each press is held long enough to span at least one tick.
const HOLD_MS = 500;
// Waits for input or clock effects; the 20 s budget for the running clock is the sandbox's, not the show's 3 s.
const SLOW = { timeout: 20_000 };

async function click(page: Page, r: Rect) {
  await page.mouse.move(r.x + r.w / 2, r.y + r.h / 2);
  await page.mouse.down();
  await page.waitForTimeout(HOLD_MS);
  await page.mouse.up();
}

async function press(page: Page, key: string) {
  await page.keyboard.down(key);
  await page.waitForTimeout(HOLD_MS);
  await page.keyboard.up(key);
}

test('clicking use-case tile 05 selects case 5', async ({ page }) => {
  const problems = await open(page, 'seed=1&paused=1&t=7.6');
  await click(page, (await layout(page)).tile4);
  await expect.poll(async () => (await state(page)).case, SLOW).toBe(5);
  expect(problems, 'console errors').toEqual([]);
});

test('clicking the GATE stage button selects the gate stage', async ({ page }) => {
  const problems = await open(page, 'seed=1&paused=1&t=7.6');
  await click(page, (await layout(page)).stage3);
  await expect.poll(async () => (await state(page)).stage, SLOW).toBe('gate');
  expect((await state(page)).case).toBe(1);
  expect(problems, 'console errors').toEqual([]);
});

test('Space pauses and the clock stops', async ({ page }) => {
  const problems = await open(page, 'seed=1&t=7.6');
  await expect.poll(async () => (await state(page)).t, SLOW).toBeGreaterThan(7.6);
  await press(page, 'Space');
  await expect.poll(async () => (await state(page)).paused, SLOW).toBe(true);
  const before = (await state(page)).t;
  await page.waitForTimeout(1000);
  expect((await state(page)).t).toBe(before);
  expect(problems, 'console errors').toEqual([]);
});

test('ArrowRight and ArrowLeft step the case by one', async ({ page }) => {
  const problems = await open(page, 'seed=1&paused=1&t=7.6');
  await press(page, 'ArrowRight');
  await expect.poll(async () => (await state(page)).case, SLOW).toBe(2);
  await press(page, 'ArrowRight');
  await expect.poll(async () => (await state(page)).case, SLOW).toBe(3);
  await press(page, 'ArrowLeft');
  await expect.poll(async () => (await state(page)).case, SLOW).toBe(2);
  expect(problems, 'console errors').toEqual([]);
});

test('F toggles the post-effects without console errors', async ({ page }) => {
  const problems = await open(page, 'seed=1&paused=1&t=7.6');
  expect((await state(page)).fx).toBe(true);
  await press(page, 'f');
  await expect.poll(async () => (await state(page)).fx, SLOW).toBe(false);
  await press(page, 'f');
  await expect.poll(async () => (await state(page)).fx, SLOW).toBe(true);
  expect(problems, 'console errors').toEqual([]);
});
