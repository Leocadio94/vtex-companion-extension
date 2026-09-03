import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const OUT = 'brand/promo-440x280.png';
const WIDTH = 440;
const HEIGHT = 280;

const iconSvg = await readFile('brand/icon.svg', 'utf8');
const iconDataUri = `data:image/svg+xml;base64,${Buffer.from(iconSvg).toString('base64')}`;

const html = `<!doctype html>
<meta charset="utf-8">
<style>
  * { margin: 0; box-sizing: border-box; }
  body {
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 18px;
    padding: 0 34px;
    background: radial-gradient(120% 100% at 12% 0%, #23262e 0%, #16181d 62%);
    color: #f2f4f7;
    font-family: 'Adwaita Sans', 'DejaVu Sans', 'Liberation Sans', sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  img { width: 76px; height: 76px; }
  h1 { font-size: 32px; font-weight: 700; letter-spacing: -0.6px; }
  p { font-size: 15px; line-height: 1.45; color: #a7aeba; max-width: 340px; }
  b { color: #F71963; font-weight: 600; }
</style>
<img src="${iconDataUri}" alt="">
<div>
  <h1>VTEX Companion</h1>
  <p>A stack, o catálogo e o SEO da loja na aba que você já está — e o preview do FastStore no <b>localhost</b>.</p>
</div>
`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await writeFile(OUT, await page.screenshot({ type: 'png' }));
await browser.close();
console.log(`${OUT} ${WIDTH}x${HEIGHT}`);
