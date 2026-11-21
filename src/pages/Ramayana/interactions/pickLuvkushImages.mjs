// Picks random images from public/images/chapters and writes luvkushImages.json
// (next to this script). Run from your PROJECT ROOT:
//   node path/to/pickLuvkushImages.mjs            -> 91 random images
//   node path/to/pickLuvkushImages.mjs --count=90 -> custom count
//   node path/to/pickLuvkushImages.mjs --ordered  -> keep chapter order instead of shuffled
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const COUNT = Number(arg('count')) || 91;
const ORDERED = process.argv.includes('--ordered');
const SRC = path.join(process.cwd(), 'public', 'images', 'chapters');
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'luvkushImages.json');

if (!fs.existsSync(SRC)) {
  console.error(`Folder not found: ${SRC}\nRun this from your project root.`);
  process.exit(1);
}

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : /\.(jpe?g|png|webp|avif|gif)$/i.test(e.name) ? [p] : [];
  });

const all = walk(SRC);
if (!all.length) {
  console.error('No images found in', SRC);
  process.exit(1);
}

for (let i = all.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [all[i], all[j]] = [all[j], all[i]];
}

let picked = all.slice(0, COUNT);
if (all.length < COUNT) {
  console.warn(`Only ${all.length} images available — repeating some to reach ${COUNT}.`);
  while (picked.length < COUNT) picked.push(all[picked.length % all.length]);
}
if (ORDERED) picked = [...picked].sort();

const urls = picked.map(
  (f) => '/images/chapters/' + path.relative(SRC, f).split(path.sep).map(encodeURIComponent).join('/')
);
fs.writeFileSync(OUT, JSON.stringify(urls, null, 2));
console.log(`Wrote ${urls.length} images (from ${all.length} found) -> ${OUT}`);