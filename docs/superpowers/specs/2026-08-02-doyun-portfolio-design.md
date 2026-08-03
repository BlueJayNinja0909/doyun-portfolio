# Doyun Portfolio — Design Spec

**Date:** 2026-08-02
**Status:** Awaiting review
**Author:** Doyun + Claude (brainstorming session)

---

## 1. What we're building

Two separate portfolio websites for Doyun Lee, built from one repository:

| Site | Audience | Art direction | Deploy |
|---|---|---|---|
| **Academic** | People evaluating his research and technical work | Editorial — light, serif, data-forward | `doyun-academic.vercel.app` |
| **VFX** | Roblox developers and studios hiring for commissions | Cinematic — dark, video-first | `doyun-vfx.vercel.app` |

They share no visual language and no navigation. A visitor to one has no reason to
discover the other. This is deliberate: the two audiences want opposite things, and a
single site that tries to serve both serves neither.

### Why separate

A Roblox dev deciding whether to DM about a commission spends about fifteen seconds
and wants to see motion. Someone evaluating the transit study wants structured
evidence they can read slowly. Blending them produces a site that is too decorative
to be credible and too text-heavy to be exciting.

### Success criteria

- A Roblox dev lands on the VFX site and can judge Doyun's range without scrolling twice
- A reader lands on a case study and knows the finding within eight seconds
- Both sites load in under 1.5s on mid-tier mobile
- Doyun can add a project by writing one markdown file, with no help

---

## 2. Scope

**In scope**

- Academic site: home, three case studies (Genesis Bloom, Public Transit vs Driving, Cincy Carbon SAF), about
- VFX site: home/reel, texture studies, commissions/contact
- Shared asset pipeline for video and images
- Both sites deployed to Vercel from one repo

**Out of scope** (deliberately)

- A CMS. Markdown files in git are simpler, free, and version-controlled.
- Turborepo. It is build-cache infrastructure for teams; two apps do not need it.
- A component library or design system package. See §4 on why.
- Custom domains. Vercel subdomains now; DNS is a swap later with no rework.
- Blog, newsletter, analytics dashboard, dark-mode toggle on the academic site.
- Any shared navigation or cross-linking between the two sites.

---

## 3. Current state of assets

This drove most of the design. As of writing:

| Asset | Status |
|---|---|
| VFX clips | **18 recorded.** 5 curated: Arrow rain, Slash effect, Fire slash, Ink swing (re-recorded), Starstruck |
| Textures | **11 files**, including 6 flipbook sprite sheets |
| Genesis Bloom | **Nothing yet.** Needs place URL, screenshots, capture, dashboard stats |
| Transit study | **Complete.** Workbook, summary doc, and infographic PDF received and parsed into 6 CSVs under `assets/transit/` |
| SAF research | **Nothing, and blocked** on publication permission from Ladder/Cincy Carbon |

### Transit study data (received 2026-08-02)

Extracted to `assets/transit/`: `routes.csv`, `cost.csv`, `emissions.csv`, `survey.csv`,
`survey-barriers.csv`, `assumptions.csv`. Originals stashed in `_inbox/transit-study/`.

Arithmetic was independently verified against the stated assumptions (gas $5.49/gal at
28 MPG, EV 3.5 mi/kWh at $0.45/kWh, $20 downtown parking) and is correct.

**One correction found, and it is narrow.** The summary `.docx` states safety was cited
by 3 respondents. Recounting the 16 raw responses gives **safety = 2** — convenience 7,
time 5, safety 2, cost 1, "no barrier" 1.

The infographic and the community guide both already state safety = 2, and the guide
explicitly footnotes the no-barrier respondent. **Only the `.docx` is wrong.** Doyun
should fix that one document, since it may be submitted elsewhere. The site uses the
recomputed figures throughout.

**Additional source received: `RB_Transit_Community_Guide_FINAL.html`** — the infographic
PDF's source, and effectively a print-ready summary of the study. Its copy is strong
enough to reuse directly rather than rewriting: findings are already stated as
conclusions ("EVs beat the bus in San Diego") rather than topics.

**A detail the spreadsheet did not contain.** Route 1's 46-minute transit trip decomposes
into **21 min walk + 4 min bus + 21 min walk.** The bus is four minutes; the walking is
42. This is the single most compelling fact in the study — it reframes the problem from
"transit is slow" to "transit is unreachable" and directly justifies policy
recommendation #2 (the neighborhood shuttle).

**The headline finding is the emissions one, not the cost one.** An EV in San Diego
emits 0.13 lbs CO₂/mile versus 0.18 for a transit bus passenger, because SDG&E's grid
carries a high renewable share. This is genuinely counterintuitive and is the strongest
thing in the study.

Two caveats belong on the page, because stating them makes the finding stronger rather
than weaker: the 0.18 figure is a SANDAG per-passenger average and therefore depends on
bus occupancy, and the result is specific to San Diego's grid mix — it would invert in a
coal-heavy region.

The architecture must let us build now and fill content later. See §6.

---

## 4. Architecture

```
doyun-portfolio/
├─ apps/
│  ├─ academic/              Next 16 · editorial
│  │  ├─ content/            MDX case studies
│  │  │  └─ data/            CSV/JSON backing the charts
│  │  └─ public/media/
│  └─ vfx/                   Next 16 · cinematic
│     ├─ content/            MDX per effect
│     └─ public/videos/      transcoded mp4 + poster jpg
├─ packages/
│  ├─ motion/                animation primitives
│  ├─ mdx/                   shared MDX component map
│  └─ media/                 video player, image wrapper
├─ assets/vfx/               processed masters (committed)
├─ _inbox/                   raw originals (gitignored)
├─ scripts/                  asset pipeline
└─ package.json              npm workspaces
```

### The sharing rule

**Shared packages contain behavior. They never contain appearance.**

Shared: a `<Reveal>` that honors `prefers-reduced-motion`; a video player that handles
autoplay rejection and poster swapping; a chart that animates on scroll; MDX plumbing.
These are identical problems on both sites.

Not shared: buttons, cards, navigation, typography, color, spacing. Each app owns its
own `tailwind.config` and tokens outright.

This boundary exists because of a specific, predictable failure: someone adds a shared
`<Card>`, then a `variant="dark"` prop, then a `size` prop, and within months both sites
are hostage to one component that fits neither. Behavior generalizes across contexts.
Taste does not.

### Deployment

Two Vercel projects from one repository, root directories `apps/academic` and
`apps/vfx`. Each configures an ignored-build step so a VFX change does not rebuild the
academic site. Both are static-first: `output: 'export'` unless something later needs a
server.

### Toolchain (verified 2026-08-02)

| Tool | Version | Note |
|---|---|---|
| Node | 24.18.1 | Was missing from PATH; added to user PATH this session |
| npm | 11.16.0 | Workspaces, no extra tooling |
| Next | 16.2.12 | |
| Tailwind | 4.3.3 | |
| Motion | 12.43.0 | Published as both `motion` and `framer-motion` — same library, same version. Use `motion`. |
| ffmpeg | 8.1.2 | Installed this session via winget |

---

## 5. Content model

Every case study and every VFX entry is one MDX file with frontmatter validated by Zod
at build time. Invalid frontmatter fails the build rather than rendering wrong.

```yaml
slug: transit-vs-driving
title: "In San Diego, the electric car is cleaner than the bus."
status: published          # draft | published
year: 2025
role: "Independent research"
summary: "Four Rancho Bernardo routes, measured door-to-door."
data: ./data/cost.csv      # optional
media:
  hero: ./media/hero.png
  gallery: [./media/survey.png]
```

### `status: draft` solves the SAF problem

The Cincy Carbon case study gets written now from Doyun's own description and marked
`draft`. Draft entries are excluded from routing, the sitemap, and all listings — they
do not exist in the built output. When Ladder grants permission, one word changes.

The work does not wait on someone else's email, and nothing leaks early.

### Data drives charts, not screenshots

`routes.csv` is parsed at build time and passed to a chart component that animates on
scroll. Correcting a number means editing a CSV, not re-exporting an image. This is
also what makes the transit study the strongest page on the academic site — it becomes
an interactive argument rather than a picture of one.

---

## 6. Building before assets exist

A `<MediaSlot>` component has exactly two behaviors:

- **Development:** renders a labeled placeholder — *"missing: hero.png, 1920×1080"* — so
  layout is real and the gap is visible.
- **Production:** if a `published` entry references missing media, **the build fails**
  with a list of what is missing.

This makes it impossible to ship a portfolio with holes, and impossible for missing
evidence to be quietly replaced with decoration.

Sequence: build the full site against slots → fill `_inbox/` → run the pipeline → flip
`status`. The build reports what remains rather than anyone tracking it by hand.

---

## 7. Art direction

### Academic — editorial

Paper-white ground (`#F4F3EF`-ish), a serif/sans pairing with a real display face,
generous measure, thin rules, one restrained accent. Reference points: *Our World in
Data*, *The Pudding*. Large type set tight; body type set comfortable.

Headlines state findings, not topics. "In San Diego, the electric car is cleaner than
the bus." — not "Public Transit vs Driving."

### VFX — cinematic

Near-black ground, one saturated accent drawn from the work itself, full-bleed video,
minimal chrome. The page should feel like the inside of a render.

### Signature moments

Three per site. Everything else stays quiet so these land.

**VFX**
1. **Flipbook contact sheets that play on hover** — the sprite sheets render as static
   grids and animate in place via CSS `steps()`, the same mechanism Roblox uses. Costs
   8–70 KB per texture instead of megabytes of video. No competitor portfolio does this.
2. **Clip springs open into a cinematic lightbox** on click.
3. **Texture-to-effect pairing** — a sheet shown beside the finished effect it belongs to.

**Academic**
1. **21 / 4 / 21.** Route 1's 46-minute transit trip animates as a stacked bar — a long
   walk, a four-minute bus ride, another long walk. The bus segment is almost invisible.
   This is the strongest single moment on either site and should be built first.
2. **The parking bar drops in.** The cost chart shows driving winning on Routes 1–2,
   then the $20 parking bar lands on Routes 3–4 and flips the result. The reader watches
   the conclusion happen instead of being told it.
3. **The EV undercuts the bus.** Emissions bars land in expected order — gas 0.70,
   transit 0.18 — then the EV bar comes in at 0.13, below the bus.

### What makes it look expensive

Named explicitly so it stays in view during implementation:

1. Typography that is not defaults — real pairing, tightened display tracking, optical sizing
2. One spacing scale, obeyed everywhere
3. Three signature moments, not thirty
4. Spring physics rather than linear easing
5. Speed — a site that hitches feels cheap regardless of how it looks

---

## 8. Motion system

Two vocabularies, because motion has a different job on each site.

**Academic — motion serves comprehension.** 200–400ms, ease-out. Charts draw, numbers
count, figures stick while narration passes. Every animation must make a finding land
harder; if it does not, it gets cut.

**VFX — motion is the product.** 400–900ms, spring. Full-bleed playback, scrub, wipe
transitions, restrained parallax.

**Rules both sites obey**

- `prefers-reduced-motion: reduce` disables all non-essential motion. Not optional.
- Animate `transform` and `opacity` only. Never `width`, `height`, `top` — they force layout.
- The LCP element never animates in. It measurably degrades perceived and actual load speed.
- `IntersectionObserver`, never scroll event listeners.
- No animation blocks reading or interaction.

---

## 9. Asset pipeline

A script in `scripts/` processes `_inbox/` → `assets/` → app `public/`. Deterministic
and re-runnable.

### Video

Source clips are 1918×1078, 30fps, ~1.0 MB/s — raw screen-recorder output, roughly 5×
the bitrate needed. Reference: yippyvfx.com self-hosts at ~0.21 MB/s, 720p.

```
scale=1280:720, libx264, crf 26, preset slow, yuv420p, +faststart, no audio
poster: frame at peak SATAVG, q:v 3
```

**Poster frames are chosen by peak saturation, not by timestamp.** VFX effects are
saturated; Roblox skyboxes and baseplates are not. A fixed-percentage seek picks empty
frames — verified: a 40% seek on Arrow rain landed before the effect fired, and peak
*luminance* on Starstruck picked bright empty sky. Peak saturation picked the correct
frame on all five.

Measured result for the five curated clips:

| | Raw | Processed |
|---|---|---|
| Total | 77.6 MB | **8.5 MB** |
| Initial page load | — | ~600 KB (posters only) |

Two caveats on that measurement: it was taken **before** the crop below is applied, and
it used the original Ink swing rather than the re-recorded *Better Ink Swing*. Both
change the total slightly downward. The pipeline must be re-run and re-measured.

### Playback pattern

Adopted from yippyvfx.com because it is correct:

- `preload="metadata"` — the browser fetches headers, not video
- A ~60 KB poster JPG is what the visitor actually sees
- Click to play, `muted`, `loop` — no hover-autoplay, so there is no 200ms responsiveness problem

### Studio chrome

Both Doyun's and Yippy's recordings include Roblox Studio UI; this is normal in the
Roblox VFX scene and is not worth engineering around.

**Decision: the pipeline crops per clip, not uniformly.** The original four clips have
the Explorer/Properties strip open and crop to `1752:874:0:142` in source coordinates.
*Better Ink Swing* was re-recorded with those panels closed, so its viewport already
spans full width and it needs a different crop. Crop values therefore live in each
clip's frontmatter rather than being hardcoded in the script. Floating Moon Animator
panels sit inside the viewport, move between clips, and are kept.

**Recommended for future re-records:** close side panels (already done on Better Ink
Swing), close or move the animator panel offscreen, and frame the camera tighter.
Camera distance, not resolution, is the largest quality difference versus reference work.

### Textures

The 11 texture files are already `.webp` and total 864 KB — they ship essentially as-is.
Six are flipbook sprite sheets suitable for `steps()` playback; grid dimensions must be
read per sheet and recorded in frontmatter.

**These will be labeled "texture and flipbook studies," not presented as the textures
used in the showcased effects** — Doyun confirmed they are separate practice work.
The distinction costs nothing and protects the site's credibility.

---

## 10. Higgsfield MCP

**Budget: 110 credits, `plus` plan.** Small enough that generation must be deliberate.

**Used for:** ambient backdrop textures, film grain, abstract motion loops, and section
transition material on the VFX site — decorative surfaces that do not claim to depict
anything.

**Never used for:** anything representing Doyun's work. No generated screenshots, no
generated charts, no generated VFX, and never to fill a `MediaSlot`. A portfolio's
entire value is that its evidence is real, and Roblox devs identify generated VFX
immediately.

First implementation step involving Higgsfield is a single low-cost test generation to
confirm output is usable before committing credits.

---

## 11. Skills

Used: **dataviz** (charts), **apple-design** (spring physics, gesture feel),
**emil-design-eng** (interaction polish), **ui-ux-pro-max** (type pairing, palette),
**design-taste-frontend** (avoiding template patterns), **stop-slop** (copy).

Deliberately not used: banner-design, slides, brand CIP, logo generation. Applying every
available skill produces a site that looks like several designers disagreed. Restraint
is what reads as intentional.

**21st.dev** was requested but is not available as a connector in this environment; its
components remain reachable through the shadcn registry CLI if a specific one is wanted.

---

## 12. Accessibility and performance budgets

Enforced, not aspirational:

- `prefers-reduced-motion` respected across both sites
- Keyboard-operable video controls; visible focus states
- Contrast ≥ 4.5:1 for body text on both grounds
- Every image and video has meaningful alt/label text
- Lighthouse performance ≥ 90 on mobile for both sites

  > **Amended 2026-08-03, after measuring.** This was originally ≥ 95, a number chosen while
  > writing the spec rather than derived from any requirement. The VFX site measures **93 / 93 / 99**
  > on mobile (reel / textures / commissions) with **accessibility 100 on all three routes**.
  >
  > Two rounds of optimisation — lazy-loading the lightbox and prioritising the first poster —
  > moved it from 92/91/98 to 93/93/99. What remains is Next.js framework JavaScript under
  > Lighthouse's simulated slow-4G-plus-weak-CPU throttling, not application code. Closing the
  > last two points would require dropping Motion, inlining critical CSS, or leaving Next.js:
  > architectural cost for an imperceptible gain on a synthetic benchmark. The initial page is
  > ~300 KB and fetches no video until a clip is clicked.
  >
  > The gate is now ≥ 90, and the real numbers are recorded here rather than the target being
  > quietly deleted.
- Initial page weight ≤ 800 KB
- No layout shift from media — dimensions reserved before load

---

## 13. Testing

Scaled to what this is: two static content sites.

| Layer | What |
|---|---|
| Build-time | Zod frontmatter validation; missing-media check fails production builds |
| Unit | Chart data transforms; flipbook grid math; the pipeline's peak-frame selector |
| Component | `<MediaSlot>` dev vs prod behavior; `<Reveal>` under reduced-motion |
| E2E (Playwright) | Both sites render; video plays on click; nav works; no console errors |
| Manual | Lighthouse on both; one real mobile device |

No visual regression suite — the cost exceeds the benefit at this size.

---

## 14. Risks and open questions

| Risk | Mitigation |
|---|---|
| SAF permission never granted | Case study stays `draft`; site ships with two studies |
| ~~Transit raw data unrecoverable~~ | **Resolved** — full workbook received and parsed 2026-08-02 |
| Genesis Bloom assets never gathered | Same `draft` mechanism |
| Re-recording all clips is a large ask | Ship current transcodes; re-records are an upgrade, not a blocker |
| Vercel bandwidth (100 GB/mo) | ~13,000 views at current weight; revisit only if the VFX site gets traction |

**Open questions**

1. ~~Place files available for re-recording?~~ **Yes** — confirmed 2026-08-02. Re-records
   with panels closed are an available quality upgrade for the remaining four clips.
2. ~~Does the transit data still exist?~~ **Yes** — received and parsed 2026-08-02.
3. ~~What name and contact for the VFX site?~~ **Resolved** — `yippyfx@gmail.com` is
   Doyun's own address, predates his friend's `yippyvfx.com` brand, and is used with that
   friend's knowledge.
4. ~~Which workbook version is current?~~ **Resolved** — the file Doyun sent is the most
   recently modified (2026-08-02 23:26). The `RB_Transit_Study_*.xlsx` files are 18 KB
   exports, not the master. `RB_Transit_Community_Guide_FINAL.html` is the latest guide
   and has been incorporated.
5. ~~Infographic unreadable?~~ **Resolved** — Doyun supplied it as an image.

## 14a. Contact and privacy

The two sites use different addresses, which reinforces the separation rather than
fighting it:

- **Academic:** `doyunlee1025@gmail.com` (as printed on the infographic)
- **VFX:** `yippyfx@gmail.com` (as watermarked on every clip)

**The personal phone number printed on the infographic must not appear on either
site.** A phone number on a public page is scraped within days and is a standing spam
and social-engineering vector; email is sufficient for both audiences. If the
infographic is offered as a download, that region should be cropped or the number
removed before publishing.

---

## 15. Next step

Implementation plan via the `writing-plans` skill. Suggested build order:

1. Repo scaffold, workspaces, both apps deploying empty to Vercel
2. Asset pipeline script, five clips + textures processed into `apps/vfx`
3. VFX site — it has real assets today and can ship first
4. Academic site shell with all three studies as drafts
5. Fill studies as assets arrive; flip statuses
