import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://127.0.0.1:3100' },
  // The site is unconditionally dark and must not depend on the visitor's
  // OS colour-scheme preference (see globals.css). Run the whole suite
  // under both `light` and `dark` emulated color schemes so a regression
  // that reintroduces a `prefers-color-scheme` branch — or any other
  // light-mode-only bug — fails here instead of shipping unnoticed the way
  // the original white-on-white bug did.
  projects: [
    {
      name: 'light-os',
      use: { ...devices['Desktop Chrome'], colorScheme: 'light' },
    },
    {
      name: 'dark-os',
      use: { ...devices['Desktop Chrome'], colorScheme: 'dark' },
    },
  ],
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
