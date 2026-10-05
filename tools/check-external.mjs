import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.argv[2] ?? 'dist';
// Pixi embeds its homepage in shader diagnostic text; it is never requested.
const allowed = new Set(['http://www.w3.org/1999/xhtml', 'http://www.w3.org/2000/svg', 'http://www.w3.org/1999/xlink', 'http://www.pixijs.com/']);
// The portal SDK is the only required network resource in CrazyGames builds.
allowed.add('https://sdk.crazygames.com/crazygames-sdk-v3.js');
async function scan(dir) {
  const failures = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) failures.push(...await scan(path));
    else if (/\.(js|html|css|json|svg)$/i.test(path)) {
      const content = await readFile(path, 'utf8');
      const urls = content.match(/https?:\/\/[^\s"'`<>\\)]+|["'`]\/\/[a-z0-9][a-z0-9.-]*\.[a-z]{2,}[^\s"'`<>]*/gi) ?? [];
      for (const url of urls) {
        if (!allowed.has(url)) failures.push(`${path}: ${url}`);
      }
    }
  }
  return failures;
}
const failures = await scan(root);
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`External URL check passed: ${root}`);
