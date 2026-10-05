// Usage: node tools/crazygames-qa.mjs <path-to-bundled-node_modules>
// Uses installed Chrome/Edge; no browser package is added to the game.
import { createRequire } from 'node:module';
import { resolve, join } from 'node:path';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createServer } from 'vite';
import assert from 'node:assert/strict';

const require = createRequire(join(resolve(process.argv[2] ?? 'node_modules'), '_qa.cjs'));
const { chromium } = require('playwright');
const output = resolve('artifacts/crazygames-qa');
await mkdir(output, { recursive: true });
const server = await createServer({ mode: 'crazygames', server: { host: '127.0.0.1', port: 5179, strictPort: true } });
await server.listen();
const origin = 'http://127.0.0.1:5179';
const results = [];
const browsers = [
  ['chrome', 'C:/Program Files/Google/Chrome/Application/chrome.exe'],
  ['edge', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'],
];
const sizes = [[907,510],[1216,684],[1077,606],[821,462],[1366,768],[1920,1080],
  [1536,864],[1280,720],[800,450],[1080,607],[390,844],[844,390]];
try {
  for (const [name, executablePath] of browsers) {
    const browser = await chromium.launch({ executablePath, headless: true });
    try {
      const context = await browser.newContext({ deviceScaleFactor: 1 });
      // A blocked SDK must not prevent Basic Launch play.
      await context.route('https://sdk.crazygames.com/**', route => route.abort());
      await context.route('**/src/main.ts', route => route.fulfill({ contentType: 'text/javascript', body:
        "import {createGame} from '/src/view/App.ts'; import '/src/style.css'; window.__qaApp = await createGame();" }));
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(origin);
      await page.waitForFunction(() => window.__qaApp);
      assert.equal(await page.locator('canvas').getAttribute('data-state'), 'Main menu');
      await page.screenshot({ path: join(output, `${name}-menu.png`) });
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.querySelector('canvas')?.dataset.state !== 'Main menu');
      for (const [width, height] of sizes) {
        await page.setViewportSize({ width, height });
        await page.waitForTimeout(100);
        await page.screenshot({ path: join(output, `${name}-${width}x${height}.png`) });
      }
      // Exercise real pointer input, settings and storage reload.
      await page.setViewportSize({ width: 390, height: 844 });
      await page.keyboard.press('1');
      await page.waitForTimeout(200);
      await page.keyboard.press('Space');
      await page.screenshot({ path: join(output, `${name}-settings.png`) });
      await page.keyboard.press('Space');
      const storage = await page.evaluate(() => ({ ...localStorage }));
      assert.ok(Object.keys(storage).some(key => key.includes('progress')));
      await page.reload();
      await page.waitForFunction(() => window.__qaApp);
      assert.deepEqual(await page.evaluate(() => ({ ...localStorage })), storage);
      const winChecks = await page.evaluate(async () => {
        const { WinScreen } = await import('/src/view/WinScreen.ts');
        let continued = 0;
        const screen = new WinScreen(1, false, () => continued++, async () => false, () => {});
        const texts = [];
        function walk(node) { if (typeof node.text === 'string') texts.push(node); node.children?.forEach(walk); }
        walk(screen);
        const next = texts.find(node => node.text === 'Next level').parent;
        const reward = texts.find(node => node.text === '2x Rewards').parent;
        const ready = screen.ready;
        next.emit('pointertap');
        const result = { ready, continued, rewardVisible: reward.visible };
        screen.destroy({ children: true });
        return result;
      });
      assert.deepEqual(winChecks, { ready: true, continued: 1, rewardVisible: false });
      // Synthetic notch verifies layout arithmetic in the actual renderer.
      await page.addStyleTag({ content: '.safe-area-probe { padding: 59px 12px 34px 20px !important; }' });
      await page.evaluate(() => window.dispatchEvent(new Event('resize')));
      await page.screenshot({ path: join(output, `${name}-safe-area.png`) });
      const bounds = await page.evaluate(() => {
        const scene = window.__qaApp.stage.children.find(node => node.scale.x !== 1);
        return { x: scene.x, y: scene.y, right: scene.x + 1080 * scene.scale.x, bottom: scene.y + 1920 * scene.scale.y };
      });
      assert.ok(bounds.x >= 20 && bounds.y >= 59 && bounds.right <= 378.001 && bounds.bottom <= 810.001);
      assert.deepEqual(errors, []);
      results.push({ browser: name, sizes, sdkBlocked: true, winChecks, safeAreaBounds: bounds, storageReload: 'passed', pageErrors: errors });
      await context.close();
      // Storage access denial must leave a playable guest session.
      const denied = await browser.newContext();
      await denied.route('https://sdk.crazygames.com/**', route => route.abort());
      await denied.addInitScript(() => {
        Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Denied', 'SecurityError'); } });
      });
      const deniedPage = await denied.newPage();
      await deniedPage.goto(`${origin}/?level=1`);
      await deniedPage.waitForSelector('canvas[data-state]');
      await deniedPage.keyboard.press('1');
      await deniedPage.screenshot({ path: join(output, `${name}-storage-denied.png`) });
      results.at(-1).storageDenied = 'playable';
      await denied.close();
    } finally { await browser.close(); }
  }
  // Verify the actual built bundle at a nested deployment path.
  const { createServer: httpServer } = await import('node:http');
  const staticServer = httpServer(async (request, response) => {
    try {
      const relative = new URL(request.url, origin).pathname.replace(/^\/portal\/tiny-sweepers\//, '');
      if (relative.includes('..') || relative.startsWith('/')) throw new Error('Invalid path');
      const file = resolve('dist/crazygames', relative || 'index.html');
      response.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.png') ? 'image/png' : 'text/html');
      response.end(await readFile(file));
    } catch { response.writeHead(404).end(); }
  });
  await new Promise(resolve => staticServer.listen(5180, '127.0.0.1', resolve));
  try {
    const browser = await chromium.launch({ executablePath: browsers[0][1], headless: true });
    try {
      const page = await browser.newPage();
      await page.route('https://sdk.crazygames.com/**', route => route.abort());
      await page.goto('http://127.0.0.1:5180/portal/tiny-sweepers/');
      await page.waitForSelector('canvas[data-state="Main menu"]');
      await page.keyboard.press('Enter');
      await page.keyboard.press('1');
      await page.screenshot({ path: join(output, 'production-nested-path.png') });
      results.push({ productionNestedPath: 'passed', sdkBlocked: true });
    } finally { await browser.close(); }
  } finally { await new Promise(resolve => staticServer.close(resolve)); }
  await writeFile(join(output, 'results.json'), JSON.stringify({ reviewed: '2026-10-05', results }, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally { await server.close(); }
