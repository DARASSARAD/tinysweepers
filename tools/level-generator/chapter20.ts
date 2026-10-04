import { mkdir, writeFile } from 'node:fs/promises';
import { PNG } from 'pngjs';
import { generateLevel } from './Generate';
import { verifySolution } from '../audit-levels';
import { mixLinkedColors } from '../mix-linked-colors';
import type { CrateData } from '../../src/logic/LevelData';

const ellipse = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) =>
  ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
type Design = { title: string; palette: string[]; paint: (x: number, y: number) => number };
const designs: Design[] = [
  { title: 'Cherry Cupcake', palette: ['#f7dce8', '#b46a34', '#ffdc69', '#ee4056', '#fff1cf', '#9d65be', '#66ad40', '#593448'],
    paint: (x, y) => {
      if (ellipse(x, y, 12, 9, 2, 2) || ellipse(x, y, 20, 9, 2, 2)) return 5;
      if (ellipse(x, y, 20, 5, 3, 1.5)) return 6;
      if (ellipse(x, y, 16, 35, 12, 2)) return 1;
      if (y >= 20 && y <= 33 && Math.abs(x - 16) <= 11 - (y - 20) * 0.25) {
        if (y === 33 || Math.abs(x - 16) > 10 - (y - 20) * 0.25) return 7;
        return Math.floor(x / 3) % 2 ? 1 : 2;
      }
      if (ellipse(x, y, 16, 19, 12, 5) || ellipse(x, y, 16, 15, 9, 5)
        || ellipse(x, y, 16, 11, 5, 4)) return y % 5 < 2 ? 3 : 4;
      if (ellipse(x, y, 16, 6, 2.5, 2.5)) return 3;
      if (y >= 2 && y <= 4 && x >= 16 && x <= 17) return 1;
      return 0;
    } },
  { title: 'Basketball Bounce', palette: ['#67cbbf', '#fb8427', '#453027'],
    paint: (x, y) => {
      if (ellipse(x, y, 16, 35, 12, 2)) return 2;
      if (!ellipse(x, y, 16, 19, 13, 13)) return 0;
      if (!ellipse(x, y, 16, 19, 12, 12)) return 2;
      const dx = x - 16; const dy = y - 19;
      if (Math.abs(dx) < 0.8 || Math.abs(dy) < 0.8
        || Math.abs(dx - 7 + dy * dy / 21) < 0.9
        || Math.abs(dx + 7 - dy * dy / 21) < 0.9) return 2;
      return 1;
    } },
  { title: 'Iced Lemonade', palette: ['#c7eef4', '#1a7294', '#ffcf31', '#fff8dd', '#62b93b'],
    paint: (x, y) => {
      if ((x === 25 && y >= 4 && y <= 8) || (y === 6 && x >= 23 && x <= 27)) return 3;
      if (y >= 3 && y <= 18 && x >= 18 && x <= 19) return 4;
      if (y >= 13 && y <= 35 && Math.abs(x - 15) <= 9 - (y - 13) * 0.15) {
        if (y === 13 || y === 35 || Math.abs(x - 15) >= 8 - (y - 13) * 0.15) return 1;
        if (y < 18) return 0;
        if ((x >= 10 && x <= 13 && y >= 19 && y <= 22)
          || (x >= 17 && x <= 20 && y >= 23 && y <= 26)) return 3;
        return 2;
      }
      if (ellipse(x, y, 8, 14, 5, 5)) return ellipse(x, y, 8, 14, 3.5, 3.5) ? 2 : 3;
      return 0;
    } },
  { title: 'Crunchy Taco', palette: ['#eed8b8', '#ad6324', '#ffcb40', '#55b638', '#f64b36', '#fff4d6'],
    paint: (x, y) => {
      if (ellipse(x, y, 16, 35, 14, 2)) return 1;
      if (!ellipse(x, y, 16, 22, 14, 13) || y < 11) return 0;
      if (y < 19) {
        if ((Math.floor(x / 3) + Math.floor(y / 2)) % 3 === 0) return 4;
        return y % 3 === 0 ? 5 : 3;
      }
      if (!ellipse(x, y, 16, 22, 12.5, 11.5) || y === 19) return 1;
      return (Math.floor(x / 4) + Math.floor(y / 4)) % 4 === 0 ? 5 : 2;
    } },
  { title: 'Golden Pear', palette: ['#b9dcf4', '#53391e', '#ffc943', '#ed8a22', '#62b334', '#fff5d3'],
    paint: (x, y) => {
      if (x >= 15 && x <= 16 && y >= 3 && y <= 9) return 1;
      if (ellipse(x, y, 22, 6, 6, 2.5)) return x < 21 ? 4 : 1;
      const body = ellipse(x, y, 16, 26, 12, 11) || ellipse(x, y, 16, 17, 7, 11);
      if (!body) return 0;
      if (!(ellipse(x, y, 16, 26, 10.8, 9.8) || ellipse(x, y, 16, 17, 5.8, 9.8))) return 1;
      if (ellipse(x, y, 11, 22, 2, 5)) return 5;
      if (x >= 17 || y >= 31) return 3;
      return 2;
    } },
  { title: 'Watermelon Puppy', palette: ['#9ac8f1', '#294f2b', '#6ace43', '#f45767', '#392a29', '#fff1d2'],
    paint: (x, y) => {
      // Watermelon basket with contrasting rind and seeds.
      let color = 0;
      if (y >= 22 && ellipse(x, y, 16, 23, 14, 14)) {
        color = !ellipse(x, y, 16, 23, 12.5, 12.5) ? 1
          : !ellipse(x, y, 16, 23, 10.5, 10.5) ? 2 : 3;
        if (color === 3 && y % 5 === 1 && x % 5 === 2) color = 4;
      }
      // Floppy ears distinguish the puppy from the reference kitten.
      if (ellipse(x, y, 7, 16, 3.5, 7) || ellipse(x, y, 25, 16, 3.5, 7)) color = 4;
      if (ellipse(x, y, 16, 15, 9, 9)) {
        color = 5;
        if (ellipse(x, y, 20, 13, 4, 5)) color = 4;
        if (y >= 13 && y <= 15 && (x === 12 || x === 20)) color = 4;
        if (ellipse(x, y, 16, 18, 2, 1.4)) color = 4;
        if (y === 21 && x >= 15 && x <= 17) color = 3;
      }
      if (ellipse(x, y, 10, 23, 3, 2) || ellipse(x, y, 22, 23, 3, 2)) color = 5;
      if ((x === 3 && y >= 3 && y <= 7) || (y === 5 && x >= 1 && x <= 5)
        || (x === 28 && y >= 7 && y <= 11) || (y === 9 && x >= 26 && x <= 30)) color = 5;
      return color;
    } },
];

const preview = new PNG({ width: 864, height: 720 });
preview.data.fill(255);
for (const [difficulty, design] of designs.entries()) {
  const id = 20 + difficulty;
  const width = 20 + difficulty * 2;
  const height = 24 + difficulty * 3;
  const pixels = Array.from({ length: width * height }, (_, i) =>
    design.paint(Math.floor((i % width + 0.5) * 32 / width),
      Math.floor((Math.floor(i / width) + 0.5) * 40 / height)));
  let level = generateLevel(id, width, height, design.palette, pixels, design.title, 20 - difficulty);
  level.blockGap = level.tileGap = 0.5;
  const source = level.lanes.map(lane => [...lane]);
  const sequence = level.solution!.map(lane => source[lane].shift()!);
  level.lanes = [[], [], [], []];
  level.solution = [];
  let pairs = 0;
  sequence.forEach((crate, step) => {
    if (crate.capacity >= 6 && step >= 13 && step % 4 === 1 && pairs < difficulty + 1) {
      const first = Math.floor(crate.capacity / 2);
      const pairId = `level-${id}-pair-${++pairs}`;
      level.lanes[1].push({ color: crate.color, capacity: first, pairId });
      level.lanes[2].push({ color: crate.color, capacity: crate.capacity - first, pairId });
      level.solution!.push(1);
    } else {
      const lane = step % 4;
      level.lanes[lane].push({ ...crate });
      level.solution!.push(lane);
    }
  });
  // Exact increasing mystery counts, distributed through the buried queue.
  const candidates: CrateData[] = level.lanes.flatMap(lane => lane.slice(1));
  const hiddenCount = difficulty * 4;
  for (let i = 0; i < hiddenCount; i++) {
    candidates[Math.floor((i + 0.5) * candidates.length / hiddenCount)].hidden = true;
  }
  level = mixLinkedColors(level);
  const result = verifySolution(level);
  if (!result.won) throw new Error(`Level ${id}: ${JSON.stringify(result)}`);
  await writeFile(`levels/level_${id}.json`, JSON.stringify(level, null, 2) + '\n');
  const originX = (difficulty % 3) * 288 + Math.floor((288 - width * 8) / 2);
  const originY = Math.floor(difficulty / 3) * 360 + Math.floor((360 - height * 8) / 2);
  pixels.forEach((color, cell) => {
    const hex = design.palette[color];
    const rgb = [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const offset = ((originY + Math.floor(cell / width) * 8 + y) * preview.width
        + originX + cell % width * 8 + x) * 4;
      rgb.forEach((channel, c) => { preview.data[offset + c] = channel; });
    }
  });
  console.log(`${id}: ${design.title}, ${pixels.length} cubes, ${level.lanes.flat().length} crates, ${hiddenCount} hidden, ${pairs} pairs, verified win`);
}
await mkdir('output/level-previews', { recursive: true });
await writeFile('output/level-previews/levels-20-25.png', PNG.sync.write(preview));
