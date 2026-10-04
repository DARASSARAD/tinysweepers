import { writeFile } from 'node:fs/promises';
import { generateLevel } from './Generate';
import { verifySolution } from '../audit-levels';
import { mixLinkedColors } from '../mix-linked-colors';
import type { CrateData } from '../../src/logic/LevelData';

const width = 32;
const height = 40;
const ellipse = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) =>
  ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
const palette = ['#633517', '#a95c24', '#e6a64d', '#ffe4a3', '#fffaf0', '#30251f'];
function paint(x: number, y: number): number {
  let color = -1;
  // Bat, held upright beside the wooden character.
  if (ellipse(x, y, 5, 13, 2.6, 8)) color = x < 5 ? 1 : 2;
  if (y >= 19 && y <= 29 && x >= 5 && x <= 6) color = 0;
  // Thin arms, legs and oversized wooden feet.
  if ((x === 11 || x === 26) && y >= 19 && y <= 29) color = 1;
  if (y >= 25 && y <= 27 && x >= 6 && x <= 11) color = 2;
  if (y >= 30 && y <= 36 && (x >= 15 && x <= 16 || x >= 22 && x <= 23)) color = 1;
  if (ellipse(x, y, 14, 37, 4, 2) || ellipse(x, y, 24, 37, 4, 2)) color = y === 38 ? 0 : 2;
  // Rounded log body with a light edge and sparse grain.
  if (x >= 12 && x <= 25 && y >= 3 && y <= 31 && (y >= 6 || ellipse(x, y, 18.5, 6, 7, 4))) {
    color = x === 12 || x === 25 || y === 31 ? 0 : x <= 15 ? 2 : 1;
    if (y <= 6 && x >= 15 && x <= 22) color = 2;
    if (y >= 23 && (x === 17 || x === 22) && y % 5 !== 0) color = 2;
    // Exaggerated eyes, brows, nose and smiling mouth.
    if (y === 9 && (x >= 14 && x <= 17 || x >= 20 && x <= 23)) color = 0;
    if (ellipse(x, y, 16, 13, 2.5, 3.5) || ellipse(x, y, 22, 13, 2.5, 3.5)) color = 4;
    if (ellipse(x, y, 16.5, 13.5, 1.2, 2) || ellipse(x, y, 22.5, 13.5, 1.2, 2)) color = 5;
    if ((x === 16 || x === 22) && y === 12) color = 4;
    if (ellipse(x, y, 19, 17, 2, 3)) color = x <= 19 ? 3 : 2;
    if (y === 21 && x >= 16 && x <= 22 || y === 20 && x === 23) color = 5;
    if (y === 20 && x >= 17 && x <= 22) color = 4;
  }
  // Hand wrapped around the bat.
  if (ellipse(x, y, 7, 25, 2, 2)) color = 2;
  return color;
}
const pixels = Array.from({ length: width * height }, (_, i) => paint(i % width, Math.floor(i / width)));
let level = generateLevel(19, width, height, palette, pixels, 'Tung Tung Tung Sahur', 16);
level.blockGap = level.tileGap = 0.5;
const sourceLanes = level.lanes.map(lane => [...lane]);
const sequence = level.solution!.map(lane => sourceLanes[lane].shift()!);
level.lanes = [[], [], [], []];
level.solution = [];
let pairs = 0;
sequence.forEach((crate, step) => {
  const lane = step % 4;
  if (crate.capacity >= 6 && step % 4 === 1 && pairs < 4) {
    const pairId = `sahur-pair-${++pairs}`;
    const first = Math.floor(crate.capacity / 2);
    level.lanes[1].push({ color: crate.color, capacity: first, pairId });
    level.lanes[2].push({ color: crate.color, capacity: crate.capacity - first, pairId });
    level.solution!.push(1);
  } else {
    level.lanes[lane].push({ ...crate });
    level.solution!.push(lane);
  }
});
level.lanes.forEach((lane: CrateData[], column) => lane.forEach((crate, depth) => {
  if (depth > 0 && (depth + column) % 3 === 1) crate.hidden = true;
}));
level = mixLinkedColors(level);
const result = verifySolution(level);
if (!result.won) throw new Error(JSON.stringify(result));
await writeFile('levels/level_019.json', JSON.stringify(level, null, 2) + '\n');
console.log(`Level 19: ${pixels.filter(c => c >= 0).length} cubes, ${pairs} connected pairs, verified win`);
