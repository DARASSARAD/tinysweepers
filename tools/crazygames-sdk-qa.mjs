// Verify Basic SDK integration against the built bundle and official CDN script.
// Usage: node tools/crazygames-sdk-qa.mjs <bundled-node_modules>
import { createRequire } from 'node:module';
import { resolve, join } from 'node:path';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import assert from 'node:assert/strict';

const require = createRequire(join(resolve(process.argv[2]), '_sdk-qa.cjs'));
const { chromium } = require('playwright');
const output = resolve('artifacts/crazygames-sdk-qa');
await mkdir(output, { recursive: true });
const server = createServer(async (request, response) => {
  try {
    const relative = new URL(request.url, 'http://127.0.0.1').pathname.slice(1) || 'index.html';
    if (relative.includes('..')) throw new Error('Invalid path');
    const file = resolve('dist/crazygames', relative);
    response.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.png') ? 'image/png' : 'text/html');
    response.end(await readFile(file));
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(5182, '127.0.0.1', resolve));
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const results = [];
try {
  for (const scenario of ['official-local-sdk', 'disabled', 'rejected', 'unresolved', 'blocked']) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => { window.__sdkQA = []; });
    await page.route('https://sdk.crazygames.com/crazygames-sdk-v3.js', async route => {
      if (scenario === 'blocked') return route.abort();
      if (scenario === 'official-local-sdk') {
        const response = await route.fetch();
        assert.equal(response.status(), 200);
        return route.fulfill({ response, body: await response.text() + `
          (() => {
            const sdk = window.CrazyGames.SDK;
            const init = sdk.init.bind(sdk);
            sdk.init = async () => {
              window.__sdkQA.push('init');
              await init();
              window.__sdkQA.push('initialized');
              const game = sdk.game;
              const traced = new Proxy(game, { get(target, name) {
                const value = Reflect.get(target, name);
                if (['loadingStop','gameplayStart','gameplayStop'].includes(name)) {
                  return () => { window.__sdkQA.push(name); return value.call(target); };
                }
                return value;
              }});
              Object.defineProperty(sdk, 'game', { value: traced, configurable: true });
            };
          })();` });
      }
      const init = scenario === 'unresolved' ? 'return new Promise(() => {});'
        : scenario === 'rejected' ? 'throw new Error("QA init rejection");' : '';
      return route.fulfill({ contentType: 'text/javascript', body: `
        window.CrazyGames = { SDK: {
          environment: 'disabled',
          async init() { window.__sdkQA.push('init'); ${init} },
          game: Object.fromEntries(['loadingStop','gameplayStart','gameplayStop'].map(name => [name, () => window.__sdkQA.push(name)])),
          ad: { requestAd() { window.__sdkQA.push('adRequest'); } }
        }};` });
    });
    await page.goto('http://127.0.0.1:5182/');
    await page.waitForSelector('canvas[data-state="Main menu"]');
    const menuEvents = await page.evaluate(() => window.__sdkQA);
    assert.ok(!menuEvents.includes('gameplayStart'), 'Menu cannot report gameplay');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    const playableEvents = await page.evaluate(() => window.__sdkQA);
    if (scenario === 'official-local-sdk') {
      assert.deepEqual(playableEvents, ['init','initialized','loadingStop','gameplayStart']);
      assert.equal(await page.evaluate(() => window.CrazyGames.SDK.environment), 'local');
      await page.keyboard.press('Space');
      await page.keyboard.press('Space');
      await page.waitForTimeout(100);
      assert.deepEqual(await page.evaluate(() => window.__sdkQA),
        ['init','initialized','loadingStop','gameplayStart','gameplayStop','gameplayStart']);
    } else assert.ok(!playableEvents.includes('gameplayStart'), 'Unavailable SDK must not receive events');
    await page.keyboard.press('1');
    await page.waitForTimeout(100);
    assert.ok(await page.locator('canvas').getAttribute('data-state') !== 'Main menu');
    assert.deepEqual(errors, []);
    await page.screenshot({ path: join(output, `${scenario}.png`) });
    results.push({ scenario, menuEvents, playableEvents, finalEvents: await page.evaluate(() => window.__sdkQA), errors });
    await page.close();
  }
  await writeFile(join(output, 'results.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
