import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const BIN = 'C:\\Users\\doyun\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.2-full_build\\bin';
const FF = path.join(BIN, 'ffmpeg.exe');
const ROOT = process.cwd();
const SRC = path.join(ROOT, '_inbox/vfx/VFX Showcase');
const TEX_SRC = path.join(ROOT, '_inbox/vfx/Textures');
const TEX_CONTENT = path.join(ROOT, 'apps/vfx/content/textures');
const OUT_V = path.join(ROOT, 'apps/vfx/public/videos');
const OUT_T = path.join(ROOT, 'apps/vfx/public/textures');

fs.mkdirSync(OUT_V, { recursive: true });
fs.mkdirSync(OUT_T, { recursive: true });

const ff = (args) => execFileSync(FF, ['-v', 'error', '-y', ...args], { stdio: 'inherit' });

/**
 * Hero background encode, emitted for whichever clip is flagged `hero` in clips.json.
 *
 * It is its own size and quality because it does a different job from a tile preview:
 * it sits full bleed behind the wordmark, heavily darkened, and it loads on every
 * visit. Wider than a preview so it does not look soft stretched across a desktop, and
 * more compressed because most of its detail is hidden under the overlay anyway.
 */
/**
 * 2.4s, down from 3.6.
 *
 * Sized to the clip rather than chosen as a round number. Every frame of the spin
 * clip was scored at 5fps for warm bright coverage, and every 3.6s window in it
 * contains a stretch where the effect has dissipated to empty sky: the best one
 * still drops to 0.2% coverage at its weakest frame. 2.4s from heroAt is the
 * longest span that stays alive the whole way through, weakest frame 6.2%. A
 * shorter loop that never goes empty reads better than a longer one that does,
 * and it costs fewer bytes.
 */
const HERO_SECONDS = 2.4;
/**
 * The hero crop is 1400x700, so 1400 is the ceiling: anything wider upscales and costs
 * bytes for no detail (measured at 1600 and 1920, both pure waste). This now sits at that
 * ceiling rather than just under it, because the hero is the one asset that is displayed
 * full bleed at whatever size the screen is, so it is the only place where the last few
 * hundred pixels of source resolution are actually visible.
 */
const HERO_WIDTH = 1400;
const HERO_CRF = 24;
/**
 * A genuine ceiling, not a quality knob.
 *
 * This was 260KB, which this footage cannot hit at any watchable quality: dense particles
 * over a bright sky are close to the worst case for H.264, and CRF 36 alone lands at
 * 828KB. The budget loop below did exactly what it was told and stepped the hero down to
 * CRF 45 to fit, which looked terrible. Set with headroom over the ~6.0MB that 1400px at
 * CRF 24 actually produces, so the loop only engages if a future clip is wildly more
 * expensive rather than quietly gutting every hero to hit a number.
 */
const HERO_MAX_KB = 7000;
/** The hero poster is the LCP element, so it is worth more than a tile thumbnail. */
const HERO_POSTER_Q = 4;

/** Hover-preview shape. Short enough to loop without feeling repetitive. */
const PREVIEW_SECONDS = 5;
/** Seconds of run-up before the saturation peak, so the effect builds on screen. */
const PREVIEW_LEAD = 1.5;

/**
 * Output budgets. Fixed quality settings produce wildly different sizes depending on how
 * busy a clip is: a dense particle effect can land 3x over a calm one at the same CRF.
 * Rather than hand-tuning per clip, anything over budget is re-encoded a step lower until
 * it fits or the attempts run out.
 *
 * Each of these sits above the measured worst case across all 16 clips, so in normal
 * operation the loop never engages. That is deliberate. A budget tight enough to bind
 * regularly is not a safety net, it is an invisible quality setting, which is exactly how
 * the hero came to ship at CRF 45. These are ceilings that catch a pathological clip, and
 * when one binds the log says DEGRADED so it gets looked at.
 */
// Worst cases below are measured at each asset's real window, not the head of the file.
// Previews are cut from the saturation peak, which is busier than the opening seconds, so
// sizing this from a `-t 5` sample of the start understates it by enough to make the
// budget bind. That mistake set this to 1800 on the first pass and beam-clash promptly
// stepped down to CRF 27.
const CLIP_MAX_KB = 12000; // worst measured: beam-clash 10041KB at CRF 21
const PREVIEW_MAX_KB = 2400; // worst measured: beam-clash 1953KB at CRF 24, from 5.0s
const POSTER_MAX_KB = 250; // worst measured: beam-clash 182KB at q3
const MAX_QUALITY_STEPS = 3;

/**
 * Starting quality per asset role. These differ because the roles have different
 * constraints, not because one matters more:
 *
 *  - Full clips stream. The browser sends range requests and starts playing long before
 *    the file finishes, so a 6MB clip and a 12MB clip begin at roughly the same moment.
 *    This is also the view someone uses to actually judge the work, so it runs highest.
 *  - Previews are hover-only, which makes them desktop-only: touch devices have no hover
 *    and go straight to the lightbox on tap. So they are tuned for a mouse on broadband
 *    rather than a phone on mobile data. They still want to arrive inside the ~400ms a
 *    cursor rests on a tile, which is a latency constraint on one viewer rather than a
 *    bandwidth one, but 5s at 854px leaves plenty of room at CRF 24.
 *  - Posters are the reel's thumbnails and are lazy-loaded below the fold, so they are
 *    cheap in practice even at high quality.
 */
const CLIP_CRF = 21;
const PREVIEW_CRF = 24;
const POSTER_Q = 3;

const kbOf = (p) => Math.round(fs.statSync(p).size / 1024);

/**
 * Encodes with `build(quality)`, stepping quality down until the result fits `maxKb`.
 * Returns the quality actually used so it can be reported honestly rather than assumed.
 */
function encodeWithinBudget(dest, maxKb, startQuality, step, build) {
  let quality = startQuality;
  for (let attempt = 0; attempt <= MAX_QUALITY_STEPS; attempt++) {
    ff(build(quality));
    if (kbOf(dest) <= maxKb || attempt === MAX_QUALITY_STEPS) {
      return { quality, kb: kbOf(dest), overBudget: kbOf(dest) > maxKb };
    }
    quality += step;
  }
  return { quality, kb: kbOf(dest), overBudget: true };
}

/**
 * Reports what an encode actually settled on.
 *
 * Lives at module scope so every caller uses it, including the hero. The hero previously
 * logged only its size, so a clip that had been stepped from CRF 36 down to 45 printed
 * "hero: 241KB" and read as a success. Size alone cannot tell you whether a budget was
 * met by encoding well or by destroying the picture, so quality is always shown when it
 * moved.
 */
const note = (r, startQ) =>
  r.overBudget ? ` OVER BUDGET at q${r.quality}` : r.quality !== startQ ? ` DEGRADED to q${r.quality}` : '';

/** Sheets larger than this are re-encoded; the textures page loads all of them at once. */
const TEXTURE_MAX_KB = 150;
/** libwebp quality for oversized sheets. High enough that sprite edges stay crisp. */
const TEXTURE_REENCODE_QUALITY = 78;

/** Frame index of peak colour saturation — where a VFX effect actually peaks. */
function peakSaturationTime(input) {
  const out = execFileSync(
    FF,
    ['-v', 'error', '-i', input, '-vf',
     'fps=4,signalstats,metadata=print:key=lavfi.signalstats.SATAVG:file=-',
     '-f', 'null', '-'],
    { encoding: 'utf8' },
  );
  let best = { t: 0, sat: -1 };
  const times = [...out.matchAll(/pts_time:([\d.]+)/g)].map((m) => Number(m[1]));
  const sats = [...out.matchAll(/SATAVG=([\d.]+)/g)].map((m) => Number(m[1]));
  times.forEach((t, i) => {
    if (sats[i] > best.sat) best = { t, sat: sats[i] };
  });
  return best.t;
}

const clips = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/clips.json'), 'utf8'));

for (const clip of clips) {
  const input = path.join(SRC, clip.src);
  const vf = `crop=${clip.crop},scale=1280:-2:flags=lanczos`;

  const clipPath = path.join(OUT_V, `${clip.slug}.mp4`);
  const clipResult = encodeWithinBudget(clipPath, CLIP_MAX_KB, CLIP_CRF, 3, (crf) => [
    '-i', input, '-an', '-vf', vf,
    '-c:v', 'libx264', '-profile:v', 'high', '-crf', String(crf), '-preset', 'slow',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    clipPath,
  ]);

  // Peak saturation finds the right frame for most effects, but it fails when the
  // effect itself is desaturated (grey smoke) or sits against a bright skybox that
  // out-saturates it — it then picks empty sky or a frame dominated by a Studio
  // panel. `posterAt` in clips.json overrides it with a hand-picked timestamp for
  // those clips, chosen off a contact sheet rather than guessed.
  const t = clip.posterAt !== undefined ? clip.posterAt : peakSaturationTime(input);
  const posterPath = path.join(OUT_V, `${clip.slug}-poster.jpg`);
  const posterResult = encodeWithinBudget(posterPath, POSTER_MAX_KB, POSTER_Q, 2, (q) => [
    '-ss', String(t), '-i', input, '-frames:v', '1', '-vf', vf, '-q:v', String(q), posterPath,
  ]);

  // Hover preview: a short, small loop that starts at the effect's peak so the
  // interesting part plays immediately. Sized to load fast enough that hovering
  // feels instant — the full-quality clip stays behind the click. Starting
  // PREVIEW_LEAD seconds before the peak gives the effect a moment of run-up
  // rather than cutting in at the brightest frame.
  const previewStart = Math.max(0, t - PREVIEW_LEAD);
  const previewPath = path.join(OUT_V, `${clip.slug}-preview.mp4`);
  const previewResult = encodeWithinBudget(previewPath, PREVIEW_MAX_KB, PREVIEW_CRF, 3, (crf) => [
    '-ss', String(previewStart), '-t', String(PREVIEW_SECONDS), '-i', input, '-an',
    '-vf', `crop=${clip.crop},scale=854:-2:flags=lanczos`,
    '-c:v', 'libx264', '-profile:v', 'main', '-crf', String(crf), '-preset', 'slow',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    previewPath,
  ]);

  // One clip doubles as the hero background. Starting a little before the peak gives
  // the effect room to build rather than opening mid flash.
  if (clip.hero) {
    const heroPath = path.join(OUT_V, 'hero.mp4');
    // `heroAt` picks the window by hand. Deriving it from the saturation peak works for
    // tile previews but not here: the peak is a single instant, and a hero needs several
    // continuous seconds that are all worth looking at. On one clip the derived window
    // landed after the effect had dissipated, leaving empty sky and a stray mouse cursor.
    const heroStart = clip.heroAt !== undefined ? clip.heroAt : Math.max(0, t - PREVIEW_LEAD * 1.5);
    const heroResult = encodeWithinBudget(heroPath, HERO_MAX_KB, HERO_CRF, 3, (crf) => [
      '-ss', String(heroStart), '-t', String(HERO_SECONDS), '-i', input, '-an',
      // `heroCrop` overrides the tile crop for the hero only. The tile crop keeps the
      // whole Studio viewport, which is fine at thumbnail size but puts floating
      // plugin panels and the command bar on screen when it fills the page.
      '-vf', `crop=${clip.heroCrop ?? clip.crop},scale=${HERO_WIDTH}:-2:flags=lanczos`,
      '-c:v', 'libx264', '-profile:v', 'main', '-crf', String(crf), '-preset', 'slow',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      heroPath,
    ]);
    ff(['-ss', String(heroStart + 1), '-i', input, '-frames:v', '1',
        // `heroCrop` overrides the tile crop for the hero only. The tile crop keeps the
      // whole Studio viewport, which is fine at thumbnail size but puts floating
      // plugin panels and the command bar on screen when it fills the page.
      '-vf', `crop=${clip.heroCrop ?? clip.crop},scale=${HERO_WIDTH}:-2:flags=lanczos`,
        '-q:v', String(HERO_POSTER_Q),
        path.join(OUT_V, 'hero-poster.jpg')]);
    console.log(
      `  hero: ${heroResult.kb}KB${note(heroResult, HERO_CRF)} from ${clip.slug} ` +
      `at ${heroStart.toFixed(1)}s, ${HERO_WIDTH}px q${heroResult.quality}`,
    );
  }

  console.log(
    `${clip.slug}: clip ${clipResult.kb}KB${note(clipResult, CLIP_CRF)}, ` +
    `poster ${posterResult.kb}KB${note(posterResult, POSTER_Q)}, ` +
    `preview ${previewResult.kb}KB${note(previewResult, PREVIEW_CRF)} (peak ${t}s)`,
  );
}

// Textures are copied from the source named in each texture MDX's `source`
// frontmatter field to a public filename matching the entry's slug. This
// keeps `source` as pure provenance (the original _inbox filename) while
// giving the public asset a meaningful name that matches the slug used in
// URLs and that apps/vfx/lib/content.ts checks for (textures/<slug>.webp).
const textureFiles = fs.readdirSync(TEX_CONTENT).filter((f) => f.endsWith('.mdx'));

for (const file of textureFiles) {
  const { data } = matter(fs.readFileSync(path.join(TEX_CONTENT, file), 'utf8'));
  const srcPath = path.join(TEX_SRC, data.source);

  if (!fs.existsSync(srcPath)) {
    throw new Error(
      `content/textures/${file} references source "${data.source}", but ` +
        `_inbox/vfx/Textures/${data.source} does not exist.`,
    );
  }

  const destPath = path.join(OUT_T, `${data.slug}.webp`);
  const srcKb = Math.round(fs.statSync(srcPath).size / 1024);

  // Every sheet on the textures page loads at once, so a few oversized sources
  // dominate that page's weight. Sheets over the threshold are re-encoded; the
  // rest are copied untouched, because re-encoding an already-small webp only
  // loses quality for no gain.
  if (srcKb > TEXTURE_MAX_KB) {
    ff(['-i', srcPath, '-c:v', 'libwebp', '-quality', String(TEXTURE_REENCODE_QUALITY),
        '-compression_level', '6', '-preset', 'drawing', destPath]);
    const outKb = Math.round(fs.statSync(destPath).size / 1024);
    console.log(`${data.slug}: re-encoded ${srcKb}KB -> ${outKb}KB (${data.source})`);
  } else {
    fs.copyFileSync(srcPath, destPath);
    console.log(`${data.slug}: copied ${srcKb}KB (${data.source})`);
  }
}

const totalKb = fs
  .readdirSync(OUT_T)
  .reduce((n, f) => n + fs.statSync(path.join(OUT_T, f)).size, 0) / 1024;
console.log(`textures total: ${Math.round(totalKb)}KB across ${fs.readdirSync(OUT_T).length} sheets`);

console.log('done');
