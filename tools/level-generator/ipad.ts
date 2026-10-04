import { writeFile } from 'node:fs/promises';
import { generateLevel } from './Generate';
import { verifySolution } from '../audit-levels';
import { mixLinkedColors } from '../mix-linked-colors';

const width = 30;
const height = 34;
const palette = ['#f5dc83', '#27314f', '#a9bbc9', '#e9f4fb', '#6c79e1', '#67cbb7', '#f38db7'];
function paint(x: number, y: number) {
  let color = 0;
  // Portrait tablet with a silver frame, dark bezel, camera and home button.
  if (x >= 4 && x <= 24 && y >= 2 && y <= 30
    && !((x === 4 || x === 24) && (y === 2 || y === 30))) {
    color = x === 4 || x === 24 || y === 2 || y === 30 ? 2 : 1;
    if (x >= 6 && x <= 22 && y >= 5 && y <= 26) {
      color = x + y < 25 ? 4 : x - y > -5 ? 5 : 6;
      // Broad highlights and four simple app tiles keep the iPad readable.
      if (y === 6 && x >= 7 && x <= 13) color = 3;
      if (y >= 10 && y <= 12 && (x >= 8 && x <= 10 || x >= 17 && x <= 19)) color = 3;
      if (y >= 17 && y <= 19 && x >= 8 && x <= 10) color = 0;
      if (y >= 17 && y <= 19 && x >= 17 && x <= 19) color = 4;
      if (y === 25 && x >= 11 && x <= 17) color = 3;
    }
    if (x === 14 && y === 3) color = 2;
    if (y === 28 && x >= 13 && x <= 15) color = 2;
    if (x === 14 && y === 28) color = 1;
  }
  // White stylus beside the tablet, with a silver tip.
  if (x >= 26 && x <= 27 && y >= 7 && y <= 28) color = y >= 26 ? 2 : 3;
  if (x === 26 && y === 29) color = 1;
  return color;
}
const pixels = Array.from({ length: width * height }, (_, i) => paint(i % width, Math.floor(i / width)));
let level = generateLevel(26, width, height, palette, pixels, 'Mystery iPad', 36);
const source = level.lanes.map(lane => [...lane]);
const sequence = level.solution!.map(lane => source[lane].shift()!);
level.lanes = Array.from({ length: 4 }, () => []);
level.solution = [];
let pairs = 0;
sequence.forEach((crate, step) => {
  if (step >= 13 && step % 8 === 5 && crate.capacity >= 6 && pairs < 2) {
    const pairId = `level-26-pair-${++pairs}`;
    const first = Math.floor(crate.capacity / 2);
    level.lanes[1].push({ color: crate.color, capacity: first, pairId });
    level.lanes[2].push({ color: crate.color, capacity: crate.capacity - first, pairId });
    level.solution!.push(1);
  } else {
    const lane = step % 4;
    level.lanes[lane].push(crate);
    level.solution!.push(lane);
  }
});
level.mysteryCells = pixels.flatMap((_, index) => {
  const x = index % width; const y = Math.floor(index / width);
  return (x >= 8 && x <= 13 && y >= 7 && y <= 14
    || x >= 17 && x <= 21 && y >= 18 && y <= 23) ? [index] : [];
});
level.blockGap = level.tileGap = 0.5;
level.difficulty = 'Easy';
level = mixLinkedColors(level);
if (!verifySolution(level).won) throw new Error('Mystery iPad failed timing verification');
await writeFile('levels/level_26.json', JSON.stringify(level, null, 2) + '\n');
console.log(`Level 26: ${pixels.length} blocks, ${level.mysteryCells?.length ?? 0} mystery blocks, ${pairs} pairs, verified win`);
