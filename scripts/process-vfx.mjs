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

  ff(['-i', input, '-an', '-vf', vf,
      '-c:v', 'libx264', '-profile:v', 'high', '-crf', '26', '-preset', 'slow',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      path.join(OUT_V, `${clip.slug}.mp4`)]);

  const t = peakSaturationTime(input);
  ff(['-ss', String(t), '-i', input, '-frames:v', '1', '-vf', vf, '-q:v', '5',
      path.join(OUT_V, `${clip.slug}-poster.jpg`)]);

  // Hover preview: a short, small loop that starts at the effect's peak so the
  // interesting part plays immediately. Sized to load fast enough that hovering
  // feels instant — the full-quality clip stays behind the click. Starting
  // PREVIEW_LEAD seconds before the peak gives the effect a moment of run-up
  // rather than cutting in at the brightest frame.
  const previewStart = Math.max(0, t - PREVIEW_LEAD);
  ff(['-ss', String(previewStart), '-t', String(PREVIEW_SECONDS), '-i', input, '-an',
      '-vf', `crop=${clip.crop},scale=640:-2:flags=lanczos`,
      '-c:v', 'libx264', '-profile:v', 'main', '-crf', '32', '-preset', 'slow',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      path.join(OUT_V, `${clip.slug}-preview.mp4`)]);

  const kb = (f) => Math.round(fs.statSync(path.join(OUT_V, f)).size / 1024);
  console.log(
    `${clip.slug}: clip ${kb(`${clip.slug}.mp4`)}KB, ` +
    `poster ${kb(`${clip.slug}-poster.jpg`)}KB, ` +
    `preview ${kb(`${clip.slug}-preview.mp4`)}KB (peak ${t}s)`,
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
