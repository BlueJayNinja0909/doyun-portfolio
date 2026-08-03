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

  console.log(`${clip.slug}: encoded, poster at ${t}s`);
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

  fs.copyFileSync(srcPath, path.join(OUT_T, `${data.slug}.webp`));
  console.log(`${data.slug}: copied from ${data.source}`);
}

console.log('done');
