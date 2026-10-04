import { writeFile } from 'node:fs/promises';
import { generateLevel } from './Generate';
import { verifySolution } from '../audit-levels';

const width = 23;
const height = 29;
const palette = ['#fff1d9', '#a86635', '#f55c9b', '#ffb3d0', '#59354a'];
const ellipse = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) =>
  ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
function paint(x: number, y: number): number {
  let color = -1;
  // Ballet legs: one straight and one extended sideways.
  if (y >= 20 && y <= 26 && x >= 10 && x <= 11) color = 0;
  if (y >= 20 && y <= 25 && Math.abs(x - (13 + (y - 20))) < 1.2) color = 0;
  if (y >= 26 && y <= 28 && x >= 9 && x <= 11) color = 2;
  if (y >= 24 && y <= 25 && x >= 18 && x <= 21) color = 2;
  // Raised arms and pink bodice.
  if (y >= 10 && y <= 15 && (Math.abs(x - (5 + (y - 10))) < 1
    || Math.abs(x - (17 - (y - 10))) < 1)) color = 0;
  if (x >= 9 && x <= 13 && y >= 11 && y <= 17) color = x <= 10 ? 3 : 2;
  // Flared tutu with three broad folds.
  if (y >= 16 && y <= 21 && Math.abs(x - 11) <= 3 + (y - 16)) {
    color = x === 7 || x === 11 || x === 15 ? 3 : 2;
    if (y === 21) color = 3;
  }
  // Cup handle to the right of the cappuccino head.
  if (ellipse(x, y, 17, 6, 3, 3)) color = 0;
  if (ellipse(x, y, 17, 6, 1.4, 1.5)) color = -1;
  // Simple cream cup, dark rim and coffee surface.
  if (y >= 3 && y <= 10 && x >= 6 && x <= 15 && (y <= 8 || x >= 7 && x <= 14)) {
    color = 0;
    if (y === 3 || x === 6 || x === 15 || y === 10) color = 1;
    if (y === 4 && x >= 7 && x <= 14) color = 1;
    if (y === 7 && (x === 9 || x === 13)) color = 4;
    if (y === 9 && x >= 10 && x <= 12) color = 2;
  }
  // Two small foam highlights instead of fine latte-art detail.
  if (y === 4 && (x === 9 || x === 12)) color = 0;
  return color;
}
const pixels = Array.from({ length: width * height }, (_, i) => paint(i % width, Math.floor(i / width)));
const level = generateLevel(2, width, height, palette, pixels, 'Ballerina Cappuccina', 12);
level.blockGap = level.tileGap = 0.5;
if (!verifySolution(level).won) throw new Error('Ballerina level failed timing verification');
await writeFile('levels/level_002.json', JSON.stringify(level, null, 2) + '\n');
console.log(`Level 2: ${pixels.filter(c => c >= 0).length} cubes, verified win`);
