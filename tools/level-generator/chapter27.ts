import { mkdir, writeFile } from 'node:fs/promises';
import { PNG } from 'pngjs';
import { generateLevel } from './Generate';
import { verifySolution } from '../audit-levels';
import { levelDifficulty } from '../../src/logic/Difficulty';
import { mixLinkedColors } from '../mix-linked-colors';
import { levelPalette } from '../../src/logic/LevelPalettes';

const ellipse = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) =>
  ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
const designs = [
  {
    title: 'Sunny Roadster',
    palette: ['#b8e6e5', '#f45850', '#26364b', '#79bddd', '#fff0c1', '#a0a9b2'],
    paint(x: number, y: number) {
      let c = 0;
      // Chunky front-facing silhouette with a stepped roof and twin tires.
      if (y >= 6 && y <= 16 && x >= (y < 8 ? 9 : y < 10 ? 7 : 5)
        && x <= (y < 8 ? 22 : y < 10 ? 24 : 26)) c = 2;
      if (y >= 7 && y <= 9 && x >= 10 && x <= 21) c = 4;
      if (y >= 10 && y <= 14 && x >= 7 && x <= 24) c = 3;
      if (y >= 10 && y <= 14 && (x === 15 || x === 16)) c = 2;
      if (y === 10 && x >= 8 && x <= 23) c = 4;
      if (y === 14 && (x >= 8 && x <= 13 || x >= 18 && x <= 23)) c = 1;
      // Side mirrors and a broad silver hood.
      if (y >= 12 && y <= 14 && (x >= 2 && x <= 4 || x >= 27 && x <= 29)) c = 2;
      if (y === 13 && (x === 3 || x === 28)) c = 4;
      if (y >= 16 && y <= 27 && x >= 4 && x <= 27) c = 2;
      if (y >= 16 && y <= 18 && x >= 5 && x <= 26) c = 5;
      if (y === 16 && x >= 6 && x <= 25) c = 4;
      if (y >= 19 && y <= 25 && x >= 5 && x <= 26) c = 1;
      // Cream headlights, dark grille and the central V-shaped trim.
      if (y >= 19 && y <= 22 && (x >= 6 && x <= 9 || x >= 22 && x <= 25)) c = 2;
      if (y >= 20 && y <= 21 && (x >= 7 && x <= 9 || x >= 22 && x <= 24)) c = 4;
      if (y >= 20 && y <= 24 && x >= 11 && x <= 20) c = 2;
      if (y >= 19 && y <= 23 && (x === 11 + y - 19 || x === 20 - (y - 19))) c = 5;
      if (y === 20 && x >= 14 && x <= 17) c = 1;
      if (y === 26 && x >= 5 && x <= 26) c = 5;
      if (y === 27 && x >= 7 && x <= 24) c = 4;
      if (y >= 28 && y <= 31 && (x >= 5 && x <= 9 || x >= 22 && x <= 26)) c = 2;
      if (y >= 28 && y <= 30 && (x === 7 || x === 24)) c = 5;
      // Small confetti sparkles around the car, using the same six colors.
      for (const [cx, cy] of [[4, 5], [27, 5], [2, 24], [29, 24], [11, 33], [21, 33]]) {
        if (Math.abs(x - cx) + Math.abs(y - cy) <= 1) c = x === cx && y === cy ? 4 : 1;
      }
      return c;
    },
  },
  {
    title: 'Happy Shiba',
    palette: ['#b8e9d5', '#df9b43', '#8e542d', '#fff2da', '#292c3d', '#f19c9b', '#73b98a'],
    paint(x: number, y: number) {
      let c = y >= 31 ? 6 : 0;
      if (ellipse(x, y, 15, 26, 8, 8)) c = 1;
      if (ellipse(x, y, 15, 27, 4, 6)) c = 3;
      if (ellipse(x, y, 25, 26, 4, 5)) c = 2;
      if (ellipse(x, y, 25, 25, 2, 3)) c = 1;
      if (y >= 3 && y <= 12 && (Math.abs(x - 7) <= (y - 3) * 0.5 || Math.abs(x - 24) <= (y - 3) * 0.5)) c = 2;
      if (y >= 5 && y <= 12 && (Math.abs(x - 7) <= (y - 5) * 0.35 || Math.abs(x - 24) <= (y - 5) * 0.35)) c = 5;
      if (ellipse(x, y, 15.5, 15, 12, 10)) c = 1;
      if (ellipse(x, y, 8, 20, 5, 4) || ellipse(x, y, 23, 20, 5, 4)) c = 3;
      if (ellipse(x, y, 15.5, 20, 6, 5)) c = 3;
      if (y === 13 && (x >= 9 && x <= 11 || x >= 20 && x <= 22)) c = 3;
      if (y >= 15 && y <= 16 && (x === 10 || x === 21)) c = 4;
      if (y === 19 && x >= 14 && x <= 17) c = 4;
      if (y === 21 && x >= 13 && x <= 18) c = 4;
      if (y >= 22 && y <= 23 && x >= 15 && x <= 16) c = 5;
      return c;
    },
  },
  {
    title: 'Glowing Halloween Pumpkin',
    palette: ['#323555', '#f98628', '#d45a24', '#ffb347', '#fff28a', '#ffd12f', '#10192c', '#68914b'],
    paint(x: number, y: number) {
      let c = 0;
      if (ellipse(x, y, 16, 31, 13, 2)) c = 6;
      if (y >= 3 && y <= 10 && x >= 14 && x <= 17 + (8 - y) * 0.3) c = 7;
      if (ellipse(x, y, 16, 21, 14, 12)) {
        c = x < 7 || x > 25 || x === 12 || x === 21 ? 2 : x < 15 ? 3 : 1;
        const eyes = y >= 15 && y <= 20 && (Math.abs(x - 10) <= (y - 15) * 0.7 || Math.abs(x - 23) <= (y - 15) * 0.7);
        const mouth = y >= 24 && y <= 28 && x >= 7 + (y - 24) && x <= 26 - (y - 24)
          && !(y === 24 && (x === 12 || x === 20));
        const nose = y >= 20 && y <= 22 && Math.abs(x - 16) <= y - 20;
        if (eyes || mouth || nose) c = 6;
        if (eyes && y >= 17 && y <= 19 || mouth && y >= 25 && y <= 27 || nose && y === 21) c = 5;
        if (eyes && y === 18 || mouth && y === 26) c = 4;
      }
      return c;
    },
  },
  {
    title: 'Crab on the Beach',
    palette: ['#f5d08b', '#64c8df', '#fff3d8', '#30364c', '#ef5946', '#ff9671', '#b8804f'],
    paint(x: number, y: number) {
      let c = y <= 11 ? 1 : 0;
      if (y === 11 + (Math.floor(x / 5) % 2)) c = 2;
      if (y >= 30 && (x * 3 + y) % 17 === 0) c = 6;
      if (ellipse(x, y, 16, 29, 12, 2)) c = 6;
      for (const side of [-1, 1]) {
        if (y >= 23 && y <= 29 && (Math.abs(x - (16 + side * (8 + (y - 23) * 1.2))) < 1.2
          || Math.abs(x - (16 + side * (8 + (y - 23) * 0.65))) < 1)) c = 4;
        if (y >= 16 && y <= 22 && Math.abs(x - (16 + side * (10 + (22 - y) * 0.35))) < 1.5) c = 4;
        if (ellipse(x, y, 16 + side * 12, 15, 3.5, 4.5)) c = 4;
        if (y <= 14 && Math.abs(x - (16 + side * 12)) < 1) c = 0;
        if (y >= 17 && y <= 21 && Math.abs(x - (16 + side * 4)) < 1.2) c = 4;
        if (ellipse(x, y, 16 + side * 4, 16, 2, 2.5)) c = 2;
        if (x === 16 + side * 4 && y === 16) c = 3;
      }
      if (ellipse(x, y, 16, 24, 9, 5)) c = y <= 22 ? 5 : 4;
      if (y === 25 && x >= 14 && x <= 18) c = 3;
      // Keep the crab inside the beach border so red shipments need a clear approach.
      if (x === 0 || x === 31) c = y <= 11 ? 1 : 0;
      return c;
    },
  },
];

const width = 32; const height = 36;
const preview = new PNG({ width: width * 8 * 4, height: height * 8 });
for (const [offset, design] of designs.entries()) {
  const id = 27 + offset;
  const pixels = Array.from({ length: width * height }, (_, i) => design.paint(i % width, Math.floor(i / width)));
  if (new Set(pixels).size !== design.palette.length) throw new Error(`Level ${id} does not use every requested color`);
  let level = generateLevel(id, width, height, levelPalette(id, design.palette), pixels, design.title, 36);
  const source = level.lanes.map(lane => [...lane]);
  const sequence = level.solution!.map(lane => source[lane].shift()!);
  level.lanes = [[], [], [], []]; level.solution = [];
  let pairs = 0;
  sequence.forEach((crate, step) => {
    if (step >= 13 && step % 8 === 5 && crate.capacity >= 6 && pairs < 2) {
      const pairId = `level-${id}-pair-${++pairs}`;
      const first = Math.floor(crate.capacity / 2);
      level.lanes[1].push({ color: crate.color, capacity: first, pairId });
      level.lanes[2].push({ color: crate.color, capacity: crate.capacity - first, pairId });
      level.solution!.push(1);
    } else {
      const lane = step % 4;
      level.lanes[lane].push(crate); level.solution!.push(lane);
    }
  });
  level.blockGap = level.tileGap = 0.5;
  level.difficulty = levelDifficulty(id);
  level = mixLinkedColors(level);
  if (!verifySolution(level).won) throw new Error(`Level ${id} failed real timing verification`);
  const requestedLevel = process.argv.find(arg => arg.startsWith('--level='));
  if (!requestedLevel || id === Number(requestedLevel.split('=')[1])) {
    await writeFile(`levels/level_${id}.json`, JSON.stringify(level, null, 2) + '\n');
  }
  for (let y = 0; y < preview.height; y++) for (let x = 0; x < width * 8; x++) {
    const hex = level.palette[pixels[Math.floor(y / 8) * width + Math.floor(x / 8)]];
    const target = (y * preview.width + offset * width * 8 + x) * 4;
    const shade = x % 8 === 7 || y % 8 === 7 ? 0.8 : 1;
    for (let channel = 0; channel < 3; channel++) preview.data[target + channel] = parseInt(hex.slice(1 + channel * 2, 3 + channel * 2), 16) * shade;
    preview.data[target + 3] = 255;
  }
  console.log(`${id}: ${design.title}, ${design.palette.length} colors, 5 docks, verified win`);
}
await mkdir('output/level-previews', { recursive: true });
await writeFile('output/level-previews/levels-27-30.png', PNG.sync.write(preview));
