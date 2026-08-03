// Overlays a candidate grid on a sprite sheet so the lines can be checked by eye.
// Usage: node scripts/sprite-contact-sheet.mjs "<input.webp>" <cols> <rows> "<output.png>"
import { execFileSync } from 'node:child_process';

const FF = 'C:\\Users\\doyun\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.2-full_build\\bin\\ffmpeg.exe';

const [input, cols, rows, output] = process.argv.slice(2);
if (!input || !cols || !rows || !output) {
  console.error('usage: sprite-contact-sheet.mjs <input> <cols> <rows> <output>');
  process.exit(1);
}

// Draw grid lines at each cell boundary over a mid-grey background so
// transparent frames stay visible.
const c = Number(cols), r = Number(rows);
const lines = [];
for (let i = 1; i < c; i++) lines.push(`drawbox=x=iw*${i}/${c}:y=0:w=2:h=ih:color=red@0.9:t=fill`);
for (let i = 1; i < r; i++) lines.push(`drawbox=x=0:y=ih*${i}/${r}:w=iw:h=2:color=red@0.9:t=fill`);

execFileSync(FF, [
  '-v', 'error', '-y',
  '-f', 'lavfi', '-i', `color=c=gray:s=1024x1024`,
  '-i', input,
  '-filter_complex', `[1:v]scale=1024:1024[fg];[0:v][fg]overlay=0:0,${lines.join(',')}`,
  '-frames:v', '1', output,
], { stdio: 'inherit' });

console.log(`wrote ${output} — ${c}x${r} grid overlay`);
