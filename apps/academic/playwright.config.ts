import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://127.0.0.1:3110' },
  // This site is unconditionally LIGHT — the mirror image of the VFX site's constraint.
  // Both projects run so a reintroduced `prefers-color-scheme` branch fails here rather
  // than shipping. On the VFX site that exact bug rendered the page unreadable while
  // every test stayed green, because Playwright defaults to light and `toBeVisible()`
  // never checks contrast.
  projects: [
    { name: 'light-os', use: { ...devices['Desktop Chrome'], colorScheme: 'light' } },
    { name: 'dark-os', use: { ...devices['Desktop Chrome'], colorScheme: 'dark' } },
  ],
  webServer: {
    // 127.0.0.1 rather than all interfaces, so Windows never prompts to allow node.exe
    // through the firewall. Port 3110 keeps it clear of the VFX suite's 3100.
    command: 'npx serve out -l tcp://127.0.0.1:3110',
    cwd: __dirname,
    url: 'http://127.0.0.1:3110',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
