import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // WebGL under SwiftShader is slow, and parallel workers share the CPU; 30 s is too tight for a scene load.
  timeout: 90_000,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    channel: 'chromium',
    viewport: { width: 1240, height: 1568 },
    deviceScaleFactor: 1,
    launchOptions: {
      args: [
        '--enable-unsafe-swiftshader',
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--enable-webgl',
        '--ignore-gpu-blocklist',
        '--disable-gpu-sandbox',
        '--no-sandbox',
      ],
    },
  },
  webServer: {
    command: 'pnpm build && pnpm vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
