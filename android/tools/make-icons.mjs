/**
 * Renders the launcher icon at every mipmap density from the Rockstar logo
 * that ships with the storefront.
 *
 * Usage: node android/tools/make-icons.mjs <res-dir> <logo.png>
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// Playwright is installed globally in this container, and ESM ignores NODE_PATH,
// so resolve it through the global root explicitly.
async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    const root = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return await import(pathToFileURL(join(root, 'playwright', 'index.js')).href);
  }
}

const pw = await loadPlaywright();
const chromium = pw.chromium ?? pw.default?.chromium;   // CJS interop

const [out, logoPath] = process.argv.slice(2);
if (!out || !logoPath) {
  console.error('usage: make-icons.mjs <res-dir> <logo.png>');
  process.exit(1);
}

const DENSITIES = [
  ['mipmap-mdpi', 48],
  ['mipmap-hdpi', 72],
  ['mipmap-xhdpi', 96],
  ['mipmap-xxhdpi', 144],
  ['mipmap-xxxhdpi', 192]
];

const logo = `data:image/png;base64,${readFileSync(logoPath).toString('base64')}`;

// The source logo is already a gold rounded square; sit it on a matching gold
// field so the icon fills its mask cleanly at every density.
const icon = size => `
<html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;background:transparent}
  .icon{width:${size}px;height:${size}px;border-radius:${Math.round(size * 0.22)}px;
        background:#fcaf17;display:flex;align-items:center;justify-content:center;overflow:hidden}
  .icon img{width:100%;height:100%;object-fit:cover;display:block}
</style></head><body>
  <div class="icon"><img src="${logo}" alt=""></div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();

for (const [dir, size] of DENSITIES) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(icon(size));
  const png = await page.screenshot({ omitBackground: true });
  const target = join(out, dir);
  mkdirSync(target, { recursive: true });
  writeFileSync(join(target, 'ic_launcher.png'), png);
  console.log(`${dir}/ic_launcher.png  ${size}x${size}  ${png.length}b`);
}

await browser.close();
