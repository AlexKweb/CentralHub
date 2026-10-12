import { expect, test } from '@playwright/test';

/** With `fx=0` the post-processing stack is not mounted; the plain scene must still become ready without errors. */
test('fx=0 renders the plain scene with no console errors', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  await page.goto('/?seed=1&paused=1&t=7.6&fx=0');
  await page.waitForFunction(() => (window as unknown as { __jev?: { ready: boolean } }).__jev?.ready === true);

  expect(consoleErrors, 'console errors').toEqual([]);
});
