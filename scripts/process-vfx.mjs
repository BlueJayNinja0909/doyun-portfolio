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

/** Hover-preview shape. Short enough to loop without feeling repetitive. */
const PREVIEW_SECONDS = 5;
/** Seconds of run-up before the saturation peak, so the effect builds on screen. */
const PREVIEW_LEAD = 1.5;

/**
 * Output budgets. Fixed quality settings produce wildly different sizes depending on
 * how busy a clip is — a dense particle effect can land 3x over a calm one at the same
 * CRF. Rather than hand-tuning per clip, anything over budget is re-encoded a step
 * lower until it fits or the attempts run out.
 */
const CLIP_MAX_KB = 9000;
const PREVIEW_MAX_KB = 400;
const POSTER_MAX_KB = 130;
const MAX_QUALITY_STEPS = 3;

/**
 * Starting quality per asset role. These differ because the roles have different
 * constraints, not because one matters more:
 *
 *  - Full clips stream. The browser sends range requests and starts playing long
 *    before the file finishes, so a 6MB clip and a 2MB clip begin at roughly the same
 *    moment. Quality here costs bandwidth, not perceived speed — so it runs high.
 *  - Previews cannot usefully stream. They are 5s and need most of the file before
 *    they play smoothly, and that has to land inside the ~400ms a cursor rests on a
 *    tile before the hover feels broken. This is the one place where bytes really are
 *    latency, so it stays modest.
 *  - Posters block first paint on the reel, so they stay small.
 */
const CLIP_CRF = 21;
const PREVIEW_CRF = 29;
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

  const note = (r, startQ) => (r.overBudget ? ' OVER' : r.quality !== startQ ? `@${r.quality}` : '');
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
