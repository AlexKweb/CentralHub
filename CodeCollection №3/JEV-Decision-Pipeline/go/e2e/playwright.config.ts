import { defineConfig } from '@playwright/test';

export default defineConfig({
  testMatch: 'frames.spec.ts',
  reporter: 'list',
  workers: 1,
  use: {
    baseURL: 'http://localhost:8090',
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
    command: 'cd .. && make wasm && go run ./cmd/serve -addr :8090',
    port: 8090,
    timeout: 300000,
    reuseExistingServer: false,
  },
});
