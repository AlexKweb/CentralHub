import { expect, test } from '@playwright/test';

/**
 * Unpaused playback from t=7.5 (case 01 · CODE) rolls over into case 02 · STATE by itself.
 * The clock waits for the first scene frame and steps at most 0.25 s per frame, so under software
 * rendering (SwiftShader, ~1 FPS when the CPU is shared) the 0.5 s of show time can take several
 * real seconds: allow 20 s (same budget as the Go variant) and poll often to catch the STATE window.
 * fx=0: post-processing renders at ~0.25 FPS in the sandbox, too slow for the 1.2 s STATE window.
 */
test('playback rolls over into case 02 STATE without input', async ({ page }) => {
  await page.goto('/?seed=1&t=7.5&fx=0');
  await page.waitForFunction(() => (window as unknown as { __jev?: { ready: boolean } }).__jev?.ready === true);
  await expect
    .poll(
      () =>
        page.evaluate(() => (window as unknown as { __jev?: { state: () => unknown } }).__jev?.state()),
      { timeout: 20_000, intervals: [100] },
    )
    .toMatchObject({ case: 2, stage: 'state', paused: false });
});
