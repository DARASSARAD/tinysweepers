import { readFile, writeFile } from 'node:fs/promises';
import { PNG } from 'pngjs';
import { Config } from '../../src/core/Config';
import { solve } from '../../src/logic/Solver';
import { generateLevel } from './Generate';

const args = process.argv.slice(2);
const input = args[0];
function option(name: string, fallback: string) {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
}
const size = Number(option('size', '16'));
const colorCount = Number(option('colors', '4'));
const id = Number(option('id', '31'));
const output = option('output', 'levels/generated.json');
if (!input || !Number.isInteger(size) || size < 4 || size > 32 || !Number.isInteger(colorCount) || colorCount < 2 || colorCount > 8) {
  throw new Error('Usage: npm run generate:level -- image.png --size 16 --colors 4 --id 31 --output levels/generated.json');
}
const image = PNG.sync.read(await readFile(input));
const samples = Array.from({ length: size * size }, (_, index) => {
  const x = Math.min(image.width - 1, Math.floor((index % size + 0.5) * image.width / size));
  const y = Math.min(image.height - 1, Math.floor((Math.floor(index / size) + 0.5) * image.height / size));
  const offset = (y * image.width + x) * 4;
  return image.data[offset + 3] < 128 ? null : [image.data[offset], image.data[offset + 1], image.data[offset + 2]];
});
const histogram = new Map<string, number>();
samples.forEach(sample => {
  if (!sample) return;
  const key = sample.map(channel => Math.round(channel / 32) * 32 > 255 ? 255 : Math.round(channel / 32) * 32).join(',');
  histogram.set(key, (histogram.get(key) ?? 0) + 1);
});
const paletteRgb = [...histogram].sort((a, b) => b[1] - a[1]).slice(0, colorCount).map(([key]) => key.split(',').map(Number));
if (!paletteRgb.length) throw new Error('The image contains no visible pixels');
const palette = paletteRgb.map(color => `#${color.map(channel => channel.toString(16).padStart(2, '0')).join('')}`);
const pixels = samples.map(sample => {
  if (!sample) return -1;
  let best = 0;
  let distance = Infinity;
  paletteRgb.forEach((color, index) => {
    const squared = color.reduce((sum, channel, c) => sum + (channel - sample[c]) ** 2, 0);
    if (squared < distance) { best = index; distance = squared; }
  });
  return best;
});
const level = generateLevel(id, size, size, palette, pixels, option('title', 'Custom mosaic'), Config.levels.lateCapacity);
const result = solve(level);
if (result.status !== 'solvable') throw new Error(`Search did not verify this level: ${result.status}`);
await writeFile(output, `${JSON.stringify(level, null, 2)}\n`);
console.log(`Wrote validated, solvable level to ${output} (${result.visited} search states)`);
