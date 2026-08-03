# doyun-portfolio

Two portfolio sites for Doyun Lee, built from one npm-workspaces monorepo. They share
behaviour packages but no visual language, because they serve opposite audiences.

| App | Audience | Status |
|---|---|---|
| `apps/vfx` | Roblox developers hiring for commissions | **Built** |
| `apps/academic` | People evaluating research and technical work | Not started |

Design spec: [`docs/superpowers/specs/2026-08-02-doyun-portfolio-design.md`](docs/superpowers/specs/2026-08-02-doyun-portfolio-design.md)

## Requirements

- Node 24+ (installed at `C:\Program Files\nodejs`)
- ffmpeg 8+ — only needed to re-process video assets

## Commands

```bash
npm install            # once, from the repo root

npm run dev:vfx        # dev server
npm run build:vfx      # static export to apps/vfx/out
npm run process:vfx    # re-encode clips and textures from _inbox/
npm test               # unit tests (54)
npm run test:e2e       # end-to-end, both colour schemes (52)
```

## The VFX site

Three routes: the reel (`/`), texture and flipbook studies (`/textures/`), and
commissions (`/commissions/`).

**Adding an effect**

1. Drop the clip in `_inbox/vfx/VFX Showcase/`
2. Add an entry to `scripts/clips.json` with its crop values
3. `npm run process:vfx`
4. Create `apps/vfx/content/effects/<slug>.mdx` with `status: published` and the real
   `width`/`height` (check with `ffprobe` — clips do not all share one aspect ratio)

**Adding a texture study**

1. Drop the sheet in `_inbox/vfx/Textures/`
2. Verify its grid empirically:
   `node scripts/sprite-contact-sheet.mjs "_inbox/vfx/Textures/<file>.webp" <cols> <rows> out.png`
   — every red line must fall between frames, never through one
3. Create `apps/vfx/content/textures/<slug>.mdx` with the verified `cols`/`rows`
4. `npm run process:vfx`

`status: draft` excludes an entry from the build entirely — no route, no sitemap. Use it
for work that is not ready or not yet cleared to publish.

## Things that will bite you if you change them

- **Video is never fetched until a tile is clicked.** The reel ships poster images only.
  An E2E test asserts zero `.mp4` requests on load; if you add a `<video>` to the grid,
  it fails. That is intentional — the clips total 9.3 MB.
- **The site is unconditionally dark.** It does not respond to `prefers-color-scheme`.
  E2E runs in both light and dark OS emulation and asserts real colour contrast, because
  a previous version rendered white-on-white in light mode while every test passed.
- **Sprite playback timing is locked to the full grid** (`cols * rows / fps`), not to the
  `frames` count. Deriving it from `frames` desynchronises the two axes on any sheet whose
  last row is partly empty. `frames` is validation metadata only.
- **`source` in texture frontmatter is provenance, not a path.** Public files are
  `<slug>.webp`.
- **`prefers-reduced-motion` must leave content visible**, not merely present at
  `opacity: 0`. Tests assert visibility, not DOM presence.

## Deploying

Not yet deployed. To do it:

1. Create an empty repo at [github.com/new](https://github.com/new) — no README, no
   `.gitignore`, no licence
2. `git remote add origin <url> && git push -u origin main`
3. Import the repo at [vercel.com/new](https://vercel.com/new), set **Root Directory** to
   `apps/vfx`, framework preset Next.js
4. Under Settings → Git → Ignored Build Step, add:
   `git diff --quiet HEAD^ HEAD -- ../../apps/vfx ../../packages ../../scripts`
   so academic-site changes do not trigger a VFX rebuild

Vercel's free tier allows 100 GB/month of bandwidth. At roughly 300 KB per visit that is
ample; the clips only count when someone actually plays one.
