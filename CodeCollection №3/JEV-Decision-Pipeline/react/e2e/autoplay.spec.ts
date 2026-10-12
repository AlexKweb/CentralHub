import { expect, test } from '@playwright/test';

/**
 * Unpaused playback from t=7.5 (case 01 · CODE) rolls over into case 02 · STATE by itself.
 * fx=0 because playback follows frame time: under SwiftShader with post-processing a frame can take
 * seconds, which skips the 1.2 s STATE window. The playback logic does not depend on fx.
 */
test('playback rolls over into case 02 STATE without input', async ({ page }) => {
  await page.goto('/?seed=1&t=7.5&fx=0');
  await expect
    .poll(
      () =>
        page.evaluate(() => (window as unknown as { __jev?: { state: () => unknown } }).__jev?.state()),
      { timeout: 3000 },
    )
    .toMatchObject({ case: 2, stage: 'state', paused: false });
});
