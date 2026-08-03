import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://127.0.0.1:3100' },
  webServer: {
    // Bind to 127.0.0.1 explicitly rather than letting `serve` listen on
    // all interfaces: on Windows this avoids the "Windows Firewall wants
    // to allow node.exe" prompt for network access, since traffic never
    // leaves the loopback interface. A dedicated port (3100) avoids
    // clashing with `next dev` if that's running locally at the same time.
    command: 'npx serve out -l tcp://127.0.0.1:3100',
    cwd: __dirname,
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
