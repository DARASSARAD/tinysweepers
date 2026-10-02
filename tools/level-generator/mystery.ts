import { writeFile } from 'node:fs/promises';
import { generateLevel } from './Generate';
import { verifySolution } from '../audit-levels';

const ellipse = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) =>
  ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
const designs = [
  { id: 16, title: 'Magic Mushroom', palette: ['#ff3025', '#ff9200', '#fff4ce', '#70df21', '#078b43'],
    paint: (x: number, y: number) => {
      if (y >= 28 && y <= 33 && (y >= 31 || (x % 8 <= 2 && y >= 28 + x % 3))) return x % 5 < 2 ? 4 : 3;
      if (x >= 12 && x <= 19 && y >= 18 && y <= 31) return 2;
      if (y >= 3 && y <= 22 && ellipse(x, y, 15.5, 21, 15.5, 18)) {
        if (ellipse(x, y, 9, 13, 2.5, 3) || ellipse(x, y, 20, 9, 3, 3) || ellipse(x, y, 25, 18, 2, 2)) return 2;
        return y >= 20 ? 1 : 0;
      }
      return -1;
    } },
  { id: 17, title: 'Friendly UFO', palette: ['#8c35e6', '#09c9df', '#b9f8ff', '#ffe323', '#302044', '#ff67b4'],
    paint: (x: number, y: number) => {
      if (y >= 26 && y <= 33 && [8, 16, 24].some(cx => Math.abs(x - cx) <= 1 + (y - 26) * 0.2)) return 3;
      if (ellipse(x, y, 15.5, 23, 15.5, 5)) {
        if (y >= 21 && y <= 24 && [6, 12, 20, 26].some(cx => Math.abs(x - cx) <= 1)) return 3;
        return y >= 21 && y <= 24 ? 1 : 0;
      }
      if (y >= 5 && y <= 20 && ellipse(x, y, 15.5, 20, 10, 15)) {
        if (y >= 14 && y <= 16 && (x === 12 || x === 19)) return 4;
        if (y === 18 && x >= 14 && x <= 17) return 4;
        if (y === 17 && (x === 10 || x === 21)) return 5;
        return 2;
      }
      if (x >= 15 && x <= 16 && y >= 1 && y <= 5) return y <= 2 ? 3 : 0;
      return -1;
    } },
  { id: 18, title: 'Cozy Fox', palette: ['#ff8500', '#ffb42c', '#fff1ce', '#582b16'],
    paint: (x: number, y: number) => {
      let color = -1;
      if (ellipse(x, y, 18, 24, 13, 10)) color = 0;
      if (ellipse(x, y, 22, 25, 7, 6)) color = 2;
      if (ellipse(x, y, 25, 23, 6, 8)) color = 0;
      if (ellipse(x, y, 25, 29, 4, 4)) color = 2;
      if (y >= 2 && y <= 13 && ((x >= 4 && x <= 5 + (y - 2) * 0.65) || (x <= 22 && x >= 21 - (y - 2) * 0.65))) color = x <= 5 || x >= 21 ? 3 : 2;
      if (ellipse(x, y, 13, 15, 12, 9)) {
        color = y >= 15 && (x < 12 || x > 14) ? 2 : 0;
        if (y === 15 && (x >= 7 && x <= 9 || x >= 17 && x <= 19)) color = 3;
        if (y >= 19 && y <= 20 && x >= 12 && x <= 14) color = 3;
        if (y <= 10 && x >= 11 && x <= 15) color = 1;
      }
      return color;
    } },
];
for (const design of designs) {
  const width = 32; const height = 34;
  const pixels = Array.from({ length: width * height }, (_, i) => design.paint(i % width, Math.floor(i / width)));
  const occupied = pixels.flatMap((c, i) => c < 0 ? [] : [i]);
  const left = Math.min(...occupied.map(i => i % width));
  const right = Math.max(...occupied.map(i => i % width));
  const top = Math.min(...occupied.map(i => Math.floor(i / width)));
  const bottom = Math.max(...occupied.map(i => Math.floor(i / width)));
  const w = right - left + 1; const h = bottom - top + 1;
  const cropped = Array.from({ length: w * h }, (_, i) => pixels[(top + Math.floor(i / w)) * width + left + i % w]);
  const level = generateLevel(design.id, w, h, design.palette, cropped, design.title, 16);
  level.blockGap = level.tileGap = 0.5;
  level.lanes.forEach((lane, laneIndex) => lane.forEach((crate, depth) => {
    if (depth > 0 && (depth + laneIndex) % 3 === 1) crate.hidden = true;
  }));
  if (!verifySolution(level).won) throw new Error(`Level ${design.id} cannot be completed`);
  await writeFile(`levels/level_${design.id.toString().padStart(3, '0')}.json`, JSON.stringify(level, null, 2) + '\n');
  console.log(`${design.id}: ${design.title}, ${occupied.length} cubes, verified win`);
}
