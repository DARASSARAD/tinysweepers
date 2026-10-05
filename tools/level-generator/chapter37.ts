import { writeFile } from 'node:fs/promises';
import { generateLevel } from './Generate';
import { verifySolution } from '../audit-levels';
import { mixLinkedColors } from '../mix-linked-colors';

// Original pixel interpretations of the four supplied screenshot subjects.
const ellipse = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) =>
  ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
const designs = [
  { title: 'Meadow Teddy', palette: ['#a7eb57', '#493548', '#a85b32', '#cd8344', '#fff8de', '#f8c64e'], paint(x: number, y: number) {
    let c = 0;
    for (const [cx, cy] of [[3, 9], [28, 13], [3, 29], [29, 29]]) {
      if (Math.abs(x - cx) + Math.abs(y - cy) <= 2) c = 4;
      if (x === cx && y === cy) c = 5;
    }
    if (ellipse(x, y, 16, 23, 11, 8) || ellipse(x, y, 7, 21, 4, 5) || ellipse(x, y, 25, 24, 4, 5)) c = 1;
    if (ellipse(x, y, 16, 23, 10, 7) || ellipse(x, y, 7, 21, 3, 4) || ellipse(x, y, 25, 24, 3, 4)) c = x < 15 ? 3 : 2;
    if (ellipse(x, y, 11, 4, 4, 3) || ellipse(x, y, 23, 4, 4, 3)) c = 1;
    if (ellipse(x, y, 11, 4, 2, 2) || ellipse(x, y, 23, 4, 2, 2)) c = 3;
    if (x >= 9 && x <= 25 && y >= 5 && y <= 18) c = x === 9 || x === 25 || y === 5 ? 1 : x < 16 ? 3 : 2;
    if (y >= 10 && y <= 12 && (x === 13 || x === 21)) c = 1;
    if (ellipse(x, y, 17, 15, 4, 3)) c = 3;
    if (y === 14 && x >= 16 && x <= 18 || x === 17 && y >= 15 && y <= 17) c = 1;
    return c;
  } },
  { title: 'Sunny Mushroom', palette: ['#59b9f0', '#493548', '#ec8426', '#ffb640', '#fff8de', '#70609c'], paint(x: number, y: number) {
    let c = 0;
    if (y >= 23 && y <= 29 && (x >= 10 && x <= 13 || x >= 21 && x <= 24)) c = 4;
    if (y === 29 && (x >= 10 && x <= 13 || x >= 21 && x <= 24)) c = 5;
    if (ellipse(x, y, 16, 17, 15, 10) && y <= 24) c = 1;
    if (ellipse(x, y, 16, 17, 14, 9) && y <= 23) c = y < 12 ? 3 : 2;
    if (ellipse(x, y, 11, 14, 3.5, 4) || ellipse(x, y, 22, 14, 3.5, 4)) c = 4;
    if (ellipse(x, y, 11.5, 14.5, 2.2, 2.6) || ellipse(x, y, 22.5, 14.5, 2.2, 2.6)) c = 5;
    if ((x === 11 || x === 22) && y === 13) c = 4;
    if (y === 19 && x >= 14 && x <= 18 || y === 18 && (x === 13 || x === 19)) c = 1;
    return c;
  } },
  { title: 'Pink Meadow Bloom', palette: ['#f7d64d', '#493548', '#fff8f0', '#f5a9cc', '#368756', '#79c653'], paint(x: number, y: number) {
    let c = 0;
    if (ellipse(x, y, 5, 5, 4, 3) || ellipse(x, y, 27, 27, 4, 3)) c = 4;
    if (ellipse(x, y, 4, 4, 2, 2) || ellipse(x, y, 28, 28, 2, 2)) c = 5;
    const petals = [[16, 9], [9, 16], [23, 16], [16, 23]];
    if (petals.some(([cx, cy]) => ellipse(x, y, cx, cy, 7, 7))) c = 1;
    if (petals.some(([cx, cy]) => ellipse(x, y, cx, cy, 6, 6))) c = 2;
    if (petals.some(([cx, cy]) => ellipse(x, y, cx, cy, 4, 4))) c = 3;
    if (ellipse(x, y, 16, 16, 4, 4)) c = 1;
    if (ellipse(x, y, 16, 16, 2.7, 2.7)) c = 0;
    return c;
  } },
  { title: 'Silly Swirl', palette: ['#6bd96b', '#493548', '#a85b32', '#d18a47', '#fff8de', '#f8cf58'], paint(x: number, y: number) {
    let c = (x * 7 + y * 11) % 83 === 0 ? 5 : 0;
    const tiers = [[16, 23, 12, 7], [18, 17, 9, 5], [19, 11, 6, 4], [18, 6, 3, 4]];
    if (tiers.some(([cx, cy, rx, ry]) => ellipse(x, y, cx, cy, rx, ry))) c = 1;
    if (tiers.some(([cx, cy, rx, ry]) => ellipse(x, y, cx, cy, rx - 1, ry - 1))) c = x < 15 || y < 9 ? 3 : 2;
    if (y === 17 && x >= 12 && x <= 25 || y === 11 && x >= 16 && x <= 23) c = 1;
    return c;
  } },
];

for (const [offset, design] of designs.entries()) {
  const id = 37 + offset;
  const width = 32; const height = 32;
  const pixels = Array.from({ length: width * height }, (_, i) => design.paint(i % width, Math.floor(i / width)));
  let level = generateLevel(id, width, height, design.palette, pixels, design.title, 24);
  const lanes = level.lanes.map(lane => [...lane]);
  const sequence = level.solution!.map(lane => lanes[lane].shift()!);
  level.lanes = [[], [], [], []]; level.solution = [];
  let pairs = 0;
  sequence.forEach((crate, step) => {
    if (crate.capacity >= 8 && step % 5 === 1 && pairs < 5) {
      const pairId = `chapter37-${id}-${++pairs}`;
      const first = Math.floor(crate.capacity / 2);
      level.lanes[1].push({ color: crate.color, capacity: first, pairId });
      level.lanes[2].push({ color: crate.color, capacity: crate.capacity - first, pairId });
      level.solution!.push(1);
    } else {
      level.lanes[step % 4].push({ ...crate }); level.solution!.push(step % 4);
    }
  });
  level.lanes.forEach((lane, column) => lane.forEach((crate, depth) => {
    if (depth > 0 && (depth + column) % 3 === 1) crate.hidden = true;
  }));
  level.mysteryCells = pixels.flatMap((_, i) => {
    const x = i % width; const y = Math.floor(i / width);
    return (x >= 8 && x <= 11 && y >= 18 && y <= 21 || x >= 21 && x <= 24 && y >= 22 && y <= 25) ? [i] : [];
  });
  level.blockGap = level.tileGap = 0.5;
  level = mixLinkedColors(level);
  const result = verifySolution(level);
  if (!result.won) throw new Error(`Level ${id}: ${JSON.stringify(result)}`);
  await writeFile(`levels/level_${String(id).padStart(3, '0')}.json`, JSON.stringify(level, null, 2) + '\n');
  console.log(`${id}: ${design.title}, ${pairs} linked pairs, ${level.mysteryCells?.length ?? 0} mystery blocks, verified win`);
}
