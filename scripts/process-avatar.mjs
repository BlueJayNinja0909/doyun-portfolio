/**
 * Turns a Roblox Studio avatar export into a web-ready GLB.
 *
 * Studio exports OBJ + MTL + loose PNGs, which is a text mesh format and uncompressed
 * textures — 4.7MB for a figure that renders about 460px tall. This gets it to
 * something shippable without touching the source export:
 *
 *  1. Oversized diffuse textures are downscaled. At the size this renders, an 896px
 *     texture is far more detail than any pixel on screen can show.
 *  2. Normal, specular and emissive maps are dropped. They are invisible on a small,
 *     stylised figure lit by two lights, and they were a third of the texture weight.
 *  3. OBJ -> binary glTF, which is the same geometry without the text encoding.
 *  4. Draco compression on the geometry.
 *
 * The export's group names are preserved through all of this, which is the point:
 * `Player8` is the head, and keeping it a separate node is what allows the head to
 * turn independently of the body.
 *
 * Run: npm run process:avatar
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import obj2gltf from 'obj2gltf';
import gltfPipeline from 'gltf-pipeline';

const ROOT = process.cwd();
const SRC = path.join(ROOT, '_inbox/avatar');
const WORK = path.join(ROOT, '.avatar-work');
const OUT = path.join(ROOT, 'apps/vfx/public/avatar');

/** Diffuse textures above this are downscaled to it. */
const MAX_TEXTURE = 512;
/**
 * Map types dropped from the MTL. Normal, specular and emissive maps contribute nothing
 * visible on a small stylised figure and were ~120KB of the texture budget.
 *
 * `Ke` (the emissive constant) must be dropped alongside `map_Ke`. Roblox writes
 * `Ke 1 1 1` on layered clothing and relies on the emissive map to modulate it —
 * removing only the map leaves the material fully emissive, which rendered the shorts
 * as a glowing white slab.
 *
 * `map_d` is deliberately NOT dropped. Roblox uses it as the alpha channel for layered
 * clothing.
 */
const DROPPED_MAPS = ['map_Bump', 'bump', 'map_Ks', 'map_Ke', 'norm', 'Ke'];

async function main() {
  fs.rmSync(WORK, { recursive: true, force: true });
  fs.mkdirSync(WORK, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });

  const objName = fs.readdirSync(SRC).find((f) => f.endsWith('.obj'));
  const mtlName = fs.readdirSync(SRC).find((f) => f.endsWith('.mtl'));
  if (!objName || !mtlName) {
    throw new Error(`Expected an .obj and .mtl in ${SRC}. Found: ${fs.readdirSync(SRC).join(', ')}`);
  }

  fs.copyFileSync(path.join(SRC, objName), path.join(WORK, objName));

  // Strip the map types we do not want the converter to pick up.
  const mtl = fs
    .readFileSync(path.join(SRC, mtlName), 'utf8')
    .split(/\r?\n/)
    .filter((line) => !DROPPED_MAPS.some((m) => line.trim().startsWith(m + ' ')))
    .join('\n');
  fs.writeFileSync(path.join(WORK, mtlName), mtl);

  let before = 0;
  let after = 0;
  for (const f of fs.readdirSync(SRC).filter((f) => /\.(png|jpg|jpeg)$/i.test(f))) {
    const from = path.join(SRC, f);
    const to = path.join(WORK, f);
    before += fs.statSync(from).size;

    // Only keep textures the trimmed MTL still references.
    if (!mtl.includes(f)) continue;

    const meta = await sharp(from).metadata();
    if ((meta.width ?? 0) > MAX_TEXTURE || (meta.height ?? 0) > MAX_TEXTURE) {
      await sharp(from).resize(MAX_TEXTURE, MAX_TEXTURE, { fit: 'inside' }).png({ quality: 88 }).toFile(to);
    } else {
      fs.copyFileSync(from, to);
    }
    after += fs.statSync(to).size;
  }
  console.log(`textures: ${Math.round(before / 1024)}KB -> ${Math.round(after / 1024)}KB`);

  const glb = await obj2gltf(path.join(WORK, objName), {
    binary: true,
    separate: false,
    metallicRoughness: true,
  });
  console.log(`glb (uncompressed): ${Math.round(glb.length / 1024)}KB`);

  const compressed = await gltfPipeline.processGlb(glb, {
    dracoOptions: {
      compressionLevel: 10,
      quantizePositionBits: 12,
      quantizeTexcoordBits: 10,
      quantizeNormalBits: 8,
    },
  });

  const dest = path.join(OUT, 'avatar.glb');
  fs.writeFileSync(dest, compressed.glb);
  console.log(`final: ${Math.round(compressed.glb.length / 1024)}KB -> ${path.relative(ROOT, dest)}`);

  fs.rmSync(WORK, { recursive: true, force: true });
}

main().catch((e) => {
  console.error('avatar pipeline failed:', e.message);
  process.exit(1);
});
