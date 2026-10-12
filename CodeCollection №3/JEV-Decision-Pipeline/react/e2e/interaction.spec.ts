import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

interface JevState {
  case: number;
  stage: string;
  t: number;
  paused: boolean;
}

const readState = (page: Page) =>
  page.evaluate(() => (window as unknown as { __jev: { state: () => JevState } }).__jev.state());

async function open(page: Page, query: string): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto(`/?${query}`);
  await page.waitForFunction(() => (window as unknown as { __jev?: { ready: boolean } }).__jev?.ready === true);
  return errors;
}

/** Waits for two animation frames, so a toggled effect has been drawn once before errors are read. */
const settle = (page: Page) =>
  page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );

test('clicking tile 05 opens case 05', async ({ page }) => {
  const errors = await open(page, 'seed=1&paused=1&t=7.6');
  await page.locator('.case-tile').nth(4).click();
  expect((await readState(page)).case).toBe(5);
  expect(errors).toEqual([]);
});

test('clicking GATE selects the gate stage of the current case', async ({ page }) => {
  await open(page, 'seed=1&paused=1&t=7.6');
  await page.locator('[data-stage="gate"]').click();
  expect((await readState(page)).stage).toBe('gate');
});

test('Space pauses playback and freezes t', async ({ page }) => {
  await open(page, 'seed=1&t=10');
  await page.keyboard.press('Space');
  const paused = await readState(page);
  expect(paused.paused).toBe(true);
  await page.waitForTimeout(1000);
  expect((await readState(page)).t).toBe(paused.t);
});

test('ArrowRight and ArrowLeft step the case by one', async ({ page }) => {
  await open(page, 'seed=1&paused=1&t=7.6');
  await page.keyboard.press('ArrowRight');
  expect((await readState(page)).case).toBe(2);
  await page.keyboard.press('ArrowLeft');
  expect((await readState(page)).case).toBe(1);
});

test('F toggles fx without console errors', async ({ page }) => {
  const errors = await open(page, 'seed=1&paused=1&t=7.6');
  const frame = page.locator('[data-frame]');
  await expect(frame).toHaveAttribute('data-fx', '1');

  await page.keyboard.press('KeyF');
  await expect(frame).toHaveAttribute('data-fx', '0');
  await settle(page);

  await page.keyboard.press('KeyF');
  await expect(frame).toHaveAttribute('data-fx', '1');
  await settle(page);

  expect(errors, 'console errors').toEqual([]);
});
