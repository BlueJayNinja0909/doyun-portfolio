import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  // @doyun/motion ships as untranspiled TS source ("main": "./src/index.ts")
  // consumed via the npm workspaces symlink — Next only compiles TS inside
  // the app by default, so workspace packages need to opt in here.
  transpilePackages: ['@doyun/motion'],
};

export default config;
