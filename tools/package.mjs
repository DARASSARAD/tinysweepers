import { mkdir, access } from 'node:fs/promises';
import { zipSync } from 'fflate';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const mode = process.argv[2] ?? 'local';
if (!['local', 'poki', 'crazygames'].includes(mode)) throw new Error('Unknown platform mode');
const root = `dist/${mode}`;
await access(`${root}/index.html`);
const files = {};
async function collect(dir, prefix = '') {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) await collect(join(dir, entry.name), `${prefix}${entry.name}/`);
    else files[`${prefix}${entry.name}`] = new Uint8Array(await readFile(join(dir, entry.name)));
  }
}
await collect(root);
await mkdir('packages', { recursive: true });
await writeFile(`packages/tiny-sweepers-${mode}.zip`, zipSync(files));
console.log(`Packaged ${root} into packages/tiny-sweepers-${mode}.zip`);
