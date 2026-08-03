# doyun.vfx

A small Roblox VFX portfolio built with Next.js (App Router, static export). Three
routes: a home reel of showcased effect clips, a texture/flipbook studies page,
and a commissions/contact page. Content lives as MDX frontmatter under
`content/effects` and `content/textures`, validated against the Zod schemas in
`lib/schema.ts` at build time.

The site is unconditionally dark — see `AGENTS.md` for the reasoning and for
notes on this repo's non-standard Next.js setup before making changes.

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

From the repo root:

```bash
npm run build:vfx
```

Produces a static export in `apps/vfx/out`.

## Tests

```bash
npx vitest run       # unit tests
npm run test:e2e      # Playwright end-to-end tests
```
