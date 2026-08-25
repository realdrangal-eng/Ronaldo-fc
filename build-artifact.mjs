/* Bundles the game into one self-contained HTML file: CSS and JS inlined,
   card art embedded as data URIs. Run: node build-artifact.mjs [outPath] */

import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';

const out = process.argv[2] || 'dist/ronaldo-fc.html';

const css = readFileSync('css/style.css', 'utf8');
const scripts = ['js/data.js', 'js/state.js', 'js/packs.js', 'js/match.js', 'js/ui.js']
  .map(f => `/* ===== ${basename(f)} ===== */\n${readFileSync(f, 'utf8')}`)
  .join('\n\n');

let html = readFileSync('index.html', 'utf8');

/* keep only what lives inside <body>; the artifact host supplies the skeleton */
html = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'));
html = html.replace(/\s*<script src="[^"]*"><\/script>/g, '');

/* card art -> data URIs, so the page has no external requests */
const paths = [...new Set(
  readFileSync('js/data.js', 'utf8').match(/assets\/cards\/[a-z0-9-]+\.png/g)
)];
let inlined = scripts;
let bytes = 0;
for (const p of paths) {
  const b64 = readFileSync(p).toString('base64');
  bytes += b64.length;
  inlined = inlined.split(`'${p}'`).join(`'data:image/png;base64,${b64}'`);
}

const page = `<title>Ronaldo FC</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Montserrat:wght@600;700;800;900&display=swap" rel="stylesheet">
<style>
${css}
</style>
${html.trim()}
<script>
${inlined}
</script>
`;

writeFileSync(out, page);
console.log(`${out}  ${(page.length / 1048576).toFixed(2)} MB  (${paths.length} cards, ${(bytes / 1048576).toFixed(2)} MB of art)`);
