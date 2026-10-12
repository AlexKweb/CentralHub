import { expect, test } from '@playwright/test';

/** A paused frame is a pure function of t: two shots a second apart must match exactly. */
test('paused scene with fx does not change over time', async ({ page }) => {
  // Two full-page WebGL screenshots under SwiftShader with post-processing take longer than the default 30 s.
  test.setTimeout(120_000);
  await page.goto('/?seed=1&paused=1&t=28.08');
  await page.waitForFunction(() => (window as unknown as { __jev?: { ready: boolean } }).__jev?.ready === true);

  const first = await page.screenshot();
  await page.waitForTimeout(1000);
  const second = await page.screenshot();

  expect(second.equals(first), 'paused screenshots differ').toBe(true);
});
