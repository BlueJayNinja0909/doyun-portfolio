import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', globals: true, setupFiles: ['./vitest.setup.ts'] },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
    // apps/vfx and the repo root each resolve their own nested copy of
    // react/react-dom (npm's hoisting didn't collapse them to one). That's
    // harmless until something calls a hook across the boundary — Lightbox
    // renders `@doyun/motion`'s SPRING_SNAPPY-consuming tree and calls
    // motion/react's useReducedMotion, and motion/react itself resolves
    // against whichever React copy is hoisted at the workspace root. Two
    // live React copies in one test run means two dispatcher singletons,
    // which is exactly what "Invalid hook call" / "Cannot read properties
    // of null (reading 'useRef')" reports. Forcing Vite to dedupe to a
    // single resolved copy fixes it for tests; it doesn't touch the Next.js
    // build, which resolves modules independently.
    dedupe: ['react', 'react-dom'],
  },
});
