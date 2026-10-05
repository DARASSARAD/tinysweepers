// Deterministic original SVG covers and real-time gameplay previews.
// Usage: node tools/crazygames-media.mjs <bundled-node_modules> <ffmpeg-executable>
import { createRequire } from 'node:module';
import { resolve, join } from 'node:path';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'vite';

const require = createRequire(join(resolve(process.argv[2]), '_media.cjs'));
const sharp = require('sharp');
const { chromium } = require('playwright');
const destination = resolve('docs/crazygames-submission');
const sahurPreview = process.argv.includes('--sahur');
await mkdir(destination, { recursive: true });
const heart = JSON.parse(await readFile('levels/level_001.json', 'utf8'));
function robot(x, y, color, size) {
  return `<g transform="translate(${x} ${y}) scale(${size / 200})">
  <ellipse cy="95" rx="115" ry="26" fill="#36582b" opacity=".16"/>
  <circle cy="12" r="101" fill="#36582b"/><circle r="101" fill="${color}"/>
  <circle cy="-5" r="86" fill="none" stroke="#ffffff" stroke-width="9" opacity=".7"/>
  <ellipse cx="-25" cy="-55" rx="37" ry="14" fill="#fff" opacity=".35"/>
  <rect x="-65" y="-35" width="130" height="65" rx="24" fill="#152637"/>
  <rect x="-42" y="-17" width="18" height="23" rx="8" fill="#b9fbff"/>
  <rect x="24" y="-17" width="18" height="23" rx="8" fill="#b9fbff"/>
  <path d="M-18 14 Q0 30 18 14" fill="none" stroke="#b9fbff" stroke-width="5" stroke-linecap="round"/>
  <g fill="#efb83e" stroke="#ba6b20" stroke-width="4"><circle cx="-79" cy="75" r="22"/><circle cx="79" cy="75" r="22"/></g></g>`;
}
function cover(width, height) {
  const portrait = height > width;
  const square = height === width;
  const titleSize = portrait ? 78 : square ? 75 : 125;
  const titleY = portrait ? 155 : square ? 125 : 200;
  const mosaicSize = portrait ? 590 : square ? 490 : 670;
  const left = (width - mosaicSize) / 2;
  const top = portrait ? 300 : square ? 215 : 330;
  const cell = mosaicSize / heart.width;
  let cubes = '';
  heart.pixels.forEach((color, index) => {
    if (color < 0) return;
    const x = left + index % heart.width * cell;
    const y = top + Math.floor(index / heart.width) * cell;
    cubes += `<rect x="${x+2}" y="${y+5}" width="${cell-3}" height="${cell-3}" rx="4" fill="#36582b" opacity=".25"/>
    <rect x="${x}" y="${y}" width="${cell-3}" height="${cell-3}" rx="4" fill="${heart.palette[color]}"/>
    <path d="M${x+5} ${y+4}h${cell-13}" stroke="#ffffff" opacity=".5" stroke-width="3"/>`;
  });
  const robots = portrait
    ? robot(180, 930, '#23d6c3', 195) + robot(590, 1000, '#ff638a', 220)
    : square ? robot(165, 635, '#23d6c3', 150) + robot(635, 635, '#ff638a', 150)
    : robot(365, 725, '#23d6c3', 310) + robot(1570, 725, '#ff638a', 310);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs><linearGradient id="bg" x2="0" y2="1"><stop stop-color="#86dbe4"/><stop offset=".6" stop-color="#e9f5b3"/><stop offset="1" stop-color="#a9df71"/></linearGradient></defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <ellipse cx="${width*.1}" cy="${height*.83}" rx="${width*.62}" ry="${height*.32}" fill="#7cce20" opacity=".18"/>
  <ellipse cx="${width*.95}" cy="${height*.7}" rx="${width*.4}" ry="${height*.4}" fill="#fff8de" opacity=".3"/>
  <text x="${width/2}" y="${titleY}" text-anchor="middle" font-family="Trebuchet MS,Arial,sans-serif" font-size="${titleSize}" font-weight="900" fill="#36582b" stroke="#fff8de" stroke-width="${titleSize*.09}" paint-order="stroke">Tiny Sweepers</text>
  ${cubes}${robots}
  <g fill="#ffffff" opacity=".9"><path d="M${width*.13} ${height*.3}l8 22 22 8-22 8-8 22-8-22-22-8 22-8z"/>
  <path d="M${width*.88} ${height*.38}l8 22 22 8-22 8-8 22-8-22-22-8 22-8z"/></g></svg>`;
}
const manifest = [];
for (const [name, width, height] of sahurPreview ? [] : [['landscape',1920,1080],['portrait',800,1200],['square',800,800]]) {
  const svg = cover(width, height);
  await writeFile(join(destination, `cover-${name}.svg`), svg);
  await sharp(Buffer.from(svg)).png().toFile(join(destination, `cover-${name}.png`));
  manifest.push({ file: `cover-${name}.png`, width, height, bytes: (await stat(join(destination, `cover-${name}.png`))).size });
}

const server = await createServer({ mode: 'crazygames', server: { host: '127.0.0.1', port: 5181, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
try {
  for (const [name, width, height] of [['landscape',1920,1080],['portrait',1080,1620]]) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
    await context.route('https://sdk.crazygames.com/**', route => route.abort());
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:5181/?level=${sahurPreview ? 19 : 1}`);
    await page.waitForSelector('canvas[data-state]');
    // Start directly with loaded gameplay, with no cover or logo transition.
    await page.addStyleTag({ content: '* { cursor: none !important; }' });
    let latest = await page.screenshot({ type: 'jpeg', quality: 85 });
    const videoFile = join(destination, `preview-${name}.webm`);
    const encoder = spawn(process.argv[3], ['-hide_banner','-loglevel','error','-f','image2pipe','-vcodec','mjpeg','-r','15','-i','pipe:0',
      '-an','-c:v','libvpx','-b:v','2500k','-y',videoFile], { windowsHide: true, stdio: ['pipe','ignore','pipe'] });
    let diagnostics = '';
    encoder.stderr.on('data', chunk => { diagnostics += chunk; });
    const ended = once(encoder, 'close');
    let capturing = false;
    let capturePromise = Promise.resolve();
    const started = performance.now();
    // Fixed real-time frame sampling; slow capture duplicates frames, never speeds play up.
    for (let frame = 0; frame < 270; frame++) {
      const delay = started + frame * 1000 / 15 - performance.now();
      if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
      if (frame === 18 || frame === 63 || frame === 108) await page.keyboard.press(String(1 + Math.floor(frame / 45) % 3));
      if (!capturing) {
        capturing = true;
        capturePromise = page.screenshot({ type: 'jpeg', quality: 85 }).then(buffer => { latest = buffer; }).finally(() => { capturing = false; });
      }
      if (!encoder.stdin.write(latest)) await once(encoder.stdin, 'drain');
    }
    await capturePromise;
    encoder.stdin.end();
    const [exitCode] = await ended;
    if (exitCode !== 0) throw new Error(diagnostics);
    await page.screenshot({ path: join(destination, `preview-${name}-last-frame.png`) });
    await context.close();
    manifest.push({ file: `preview-${name}.webm`, width, height, seconds: 18, fps: 15, audio: false, bytes: (await stat(videoFile)).size });
    console.log(`Created ${name} gameplay preview`);
  }
  const existing = sahurPreview ? JSON.parse(await readFile(join(destination, 'covers-v2.json'), 'utf8')) : [];
  await writeFile(join(destination, 'assets.json'), JSON.stringify([...existing, ...manifest], null, 2));
  console.log(JSON.stringify(manifest, null, 2));
} finally { await browser.close(); await server.close(); }
