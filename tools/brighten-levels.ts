import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { PNG } from 'pngjs';
import { levelPalette } from '../src/logic/LevelPalettes';
import type { LevelData } from '../src/logic/LevelData';

const files = (await readdir('levels')).filter(file => /^level_\d+\.json$/.test(file));
const levels: LevelData[] = [];
for (const file of files) {
  const path = `levels/${file}`;
  const level = JSON.parse(await readFile(path, 'utf8')) as LevelData;
  const before = JSON.stringify({ ...level, palette: [] });
  level.palette = levelPalette(level.id, level.palette);
  if (new Set(level.palette).size !== level.palette.length) throw new Error(`Duplicate colors in level ${level.id}`);
  if (JSON.stringify({ ...level, palette: [] }) !== before) throw new Error(`Puzzle changed in level ${level.id}`);
  await writeFile(path, JSON.stringify(level, null, 2) + '\n');
  levels.push(level);
}
levels.sort((a, b) => a.id - b.id);
const render = async (items: LevelData[], columns: number, size: number, name: string) => {
  const preview = new PNG({ width: columns * size, height: Math.ceil(items.length / columns) * size });
  for (const [offset, level] of items.entries()) for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const px = Math.floor(x * level.width / size); const py = Math.floor(y * level.height / size);
    const color = level.pixels[py * level.width + px];
    const hex = color < 0 ? '#eee5ce' : level.palette[color];
    const target = ((Math.floor(offset / columns) * size + y) * preview.width + offset % columns * size + x) * 4;
    const edge = color >= 0 && (px !== Math.floor((x + 1) * level.width / size) || py !== Math.floor((y + 1) * level.height / size));
    for (let channel = 0; channel < 3; channel++) preview.data[target + channel] = parseInt(hex.slice(1 + channel * 2, 3 + channel * 2), 16) * (edge ? 0.8 : 1);
    preview.data[target + 3] = 255;
  }
  await writeFile(`output/level-previews/${name}.png`, PNG.sync.write(preview));
};
await mkdir('output/level-previews', { recursive: true });
await render(levels, 6, 160, 'all-levels-vibrant');
await render(levels.filter(level => level.id >= 31), 3, 288, 'levels-31-36');
console.log(`Updated ${levels.length} palettes; all puzzle data preserved.`);
