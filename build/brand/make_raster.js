// Raster brand assets from brand/source + brand/og-card.svg. One-off asset step, NOT part of the
// Netlify build (the outputs are committed). Needs `sharp`; this repo has no node_modules, so run:
//   python build/brand/make_logos.py
//   NODE_PATH=../carpetcleaningservice-ie/node_modules node build/brand/make_raster.js
// sharp drops EXIF/GPS by default (no .withMetadata()), which is what we want for job photos.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'brand', 'source');
const IMG = path.join(ROOT, 'site-assets', 'images');
const BRAND = path.join(IMG, 'brand');

async function main() {
  fs.mkdirSync(BRAND, { recursive: true });

  // Share card for pages without their own photo.
  await sharp(fs.readFileSync(path.join(ROOT, 'brand', 'og-card.svg')), { density: 72 })
    .resize(1200, 630).flatten({ background: '#102A43' })
    .jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(BRAND, 'og-default.jpg'));

  // The owner's own van photo (supplied "website hero crop"), sized for the home and area heroes.
  await sharp(path.join(SRC, 'van-hero.jpg')).resize({ width: 1600 })
    .jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(IMG, 'house-clearance-van-dublin.jpg'));

  // Favicons: the owner's navy tile (visible on light and dark browser tabs).
  fs.copyFileSync(path.join(SRC, 'favicon.svg'), path.join(ROOT, 'site-assets', 'favicon.svg'));
  for (const [from, to] of [['favicon-16.png', 'favicon-16.png'], ['favicon-32.png', 'favicon-32.png'],
    ['favicon-180.png', 'apple-touch-icon.png'], ['favicon-192.png', 'icon-192.png']]) {
    fs.copyFileSync(path.join(SRC, 'icons', from), path.join(BRAND, to));
  }
  for (const f of fs.readdirSync(BRAND)) {
    const p = path.join(BRAND, f);
    console.log(f.padEnd(28), fs.statSync(p).size, 'bytes');
  }
  console.log('house-clearance-van-dublin.jpg', fs.statSync(path.join(IMG, 'house-clearance-van-dublin.jpg')).size, 'bytes');
}

main().catch(e => { console.error(e); process.exit(1); });
