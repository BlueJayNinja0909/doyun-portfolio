import { defineConfig } from 'vitest/config';

// Root config so `npx vitest run` from the repo root discovers tests in both
// apps/vfx and packages/* — each keeps its own vitest.config.ts (environment,
// setup files, plugins), referenced here as a project.
export default defineConfig({
  test: {
    projects: [
      'apps/vfx',
      'apps/academic',
      'packages/*',
      {
        test: {
          name: 'scripts',
          environment: 'node',
          include: ['scripts/**/*.test.mjs'],
        },
      },
    ],
  },
});
