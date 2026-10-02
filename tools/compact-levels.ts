import fs from 'node:fs';
import { vibrantColor } from '../src/core/Color';
import type { LevelData } from '../src/logic/LevelData';

for (const file of fs.readdirSync('levels').filter(file => /^level_\d+\.json$/.test(file)).sort()) {
  const path = `levels/${file}`;
  const level = JSON.parse(fs.readFileSync(path, 'utf8')) as LevelData;
  const occupied = level.pixels.flatMap((color, index) => color < 0 ? [] : [index]);
  const xs = occupied.map(index => index % level.width);
  const ys = occupied.map(index => Math.floor(index / level.width));
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  const oldWidth = level.width;
  const oldPixels = level.pixels;
  level.width = right - left + 1;
  level.height = bottom - top + 1;
  level.pixels = Array.from({ length: level.width * level.height }, (_, index) => {
    const x = index % level.width + left;
    const y = Math.floor(index / level.width) + top;
    return oldPixels[y * oldWidth + x];
  });
  if (level.blockGap === undefined) level.palette = level.palette.map(vibrantColor);
  level.blockGap = 0.5;
  level.tileGap = 0.5;
  fs.writeFileSync(path, `${JSON.stringify(level, null, 2)}\n`);
  console.log(`${file}: ${oldWidth}x${oldPixels.length / oldWidth} -> ${level.width}x${level.height}`);
}
