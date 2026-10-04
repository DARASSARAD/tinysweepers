import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { PNG } from 'pngjs';
import { generateLevel } from './Generate';
import { verifySolution, findWinningSolution } from '../audit-levels';
import { sample } from '../tune-difficulty';
import { difficultyBands, levelDifficulty } from '../../src/logic/Difficulty';
import { mixLinkedColors } from '../mix-linked-colors';
import { BoardModel } from '../../src/logic/BoardModel';
import { levelPalette } from '../../src/logic/LevelPalettes';

const ellipse = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
const designs = [
  { title: 'Comet Rocket', palette: ['#b9e8ed', '#293651', '#547ad4', '#fff0cc', '#f09c47', '#e55b70'], paint(x: number, y: number) {
    const u = (x + y - 31) / 1.414; const v = (y - x + 1) / 1.414;
    let c = 0;
    if (u >= -11 && u <= 10 && Math.abs(v) <= 5 - Math.max(0, u - 4) * 0.55) c = 1;
    if (u >= -9 && u <= 8 && Math.abs(v) <= 3.5 - Math.max(0, u - 4) * 0.55) c = u > 4 ? 5 : 2;
    if (u < -3 && u > -10 && Math.abs(v) > 3 && Math.abs(v) < 8 && Math.abs(v) < -u) c = 5;
    if (u < -10 && u > -17 && Math.abs(v) < (u + 17) * 0.6) c = 4;
    if (u < -10 && u > -15 && Math.abs(v) < (u + 15) * 0.5) c = 3;
    if (ellipse(u, v, 1, 0, 3, 3)) c = 1;
    if (ellipse(u, v, 1, 0, 1.8, 1.8)) c = 3;
    for (const [sx, sy] of [[5, 5], [26, 29], [24, 4]]) if (Math.abs(x - sx) + Math.abs(y - sy) <= 1) c = 3;
    return c;
  } },
  { title: 'Candy Capsule Machine', palette: ['#eee5ce', '#30324a', '#65bba9', '#d9f0ed', '#ee7083', '#f3bb50', '#787bac'], paint(x: number, y: number) {
    let c = 0;
    if (ellipse(x, y, 15.5, 12, 11, 10)) c = 1;
    if (ellipse(x, y, 15.5, 12, 9, 8)) c = 3;
    for (const [cx, cy, color] of [[10, 14, 4], [16, 16, 5], [22, 14, 6], [14, 10, 6], [20, 9, 4], [9, 9, 5]]) if (ellipse(x, y, cx, cy, 2.5, 2.5)) c = color;
    if (y >= 21 && y <= 31 && x >= 8 && x <= 23) c = 1;
    if (y >= 22 && y <= 30 && x >= 9 && x <= 22) c = 2;
    if (y >= 24 && y <= 26 && x >= 13 && x <= 18) c = 5;
    if (y === 25 && x >= 14 && x <= 17) c = 1;
    if (y >= 28 && y <= 30 && x >= 13 && x <= 18) c = 1;
    if (y >= 32 && y <= 33 && x >= 6 && x <= 25) c = 1;
    return c;
  } },
  { title: 'Kiwi Ice Pop', palette: ['#dbeef0', '#35364c', '#89bd54', '#c5df75', '#fff2c9', '#b37b4b'], paint(x: number, y: number) {
    const u = (x + y - 31) / 1.414; const v = (y - x) / 1.414;
    let c = 0;
    if (u >= 8 && u <= 18 && Math.abs(v) <= 2) c = 5;
    if (u >= 9 && u <= 17 && v === 0) c = 4;
    if (u >= -13 && u <= 9 && Math.abs(v) <= 7 && (u > -9 || ellipse(u, v, -9, 0, 4, 7))) c = 1;
    if (u >= -12 && u <= 8 && Math.abs(v) <= 5.5 && (u > -8 || ellipse(u, v, -8, 0, 4, 5.5))) c = v < -3 ? 3 : 2;
    if (ellipse(u, v, -2, 0, 4.5, 4.5)) c = 3;
    if (ellipse(u, v, -2, 0, 1.5, 1.5)) c = 4;
    if (ellipse(u, v, -2, 0, 3.5, 3.5) && !ellipse(u, v, -2, 0, 2, 2) && (x + y) % 3 === 0) c = 1;
    return c;
  } },
  { title: 'Snowy Woodland Cottage', palette: ['#b7d9eb', '#35394c', '#977154', '#fff2d5', '#81ac86', '#efaf55', '#d67561'], paint(x: number, y: number) {
    let c = 0;
    if (y >= 29) c = 3;
    if (y >= 14 && y <= 30 && x >= 7 && x <= 25) c = 1;
    if (y >= 15 && y <= 29 && x >= 8 && x <= 24) c = 2;
    if (y >= 6 && y <= 16 && Math.abs(x - 16) <= (y - 5) * 1.35) c = 1;
    if (y >= 7 && y <= 15 && Math.abs(x - 16) <= (y - 6) * 1.35) c = 4;
    if (y >= 6 && y <= 10 && x >= 22 && x <= 24) c = 6;
    if (y >= 6 && y <= 17 && Math.abs(Math.abs(x - 16) - (y - 5) * 1.35) <= 1.3) c = 3;
    if (y >= 20 && y <= 30 && x >= 14 && x <= 19) c = 1;
    if (y >= 21 && y <= 29 && x >= 15 && x <= 18) c = 6;
    if (y >= 18 && y <= 22 && (x >= 9 && x <= 12 || x >= 21 && x <= 23)) c = 5;
    if (y === 20 && (x >= 9 && x <= 12 || x >= 21 && x <= 23)) c = 1;
    if (y >= 31 && y <= 32 && x >= 6 && x <= 26) c = 2;
    return c;
  } },
  { title: 'Tulip Bouquet', palette: ['#c7b8e9', '#34364c', '#719956', '#e77d9d', '#f3ba59', '#fff0d0', '#bd8459'], paint(x: number, y: number) {
    let c = 0;
    for (const [cx, cy] of [[8, 12], [16, 8], [24, 13]]) {
      if (y >= cy && y <= 26 && Math.abs(x - (cx + (16 - cx) * (y - cy) / (27 - cy))) <= 1) c = 2;
      if (ellipse(x, y, cx + (cx < 16 ? 3 : -3), cy + 9, 4, 2)) c = 2;
      if (ellipse(x, y, cx, cy, 5, 5) && y >= cy - 3) c = 1;
      if (ellipse(x, y, cx, cy, 4, 4) && y >= cy - 2) c = cx === 16 ? 4 : 3;
      if (y >= cy - 4 && y <= cy && (x === cx - 3 || x === cx || x === cx + 3)) c = cx === 16 ? 4 : 3;
    }
    if (y >= 24 && y <= 32 && Math.abs(x - 16) <= 9 - (y - 24) * 0.45) c = 1;
    if (y >= 25 && y <= 31 && Math.abs(x - 16) <= 7.5 - (y - 25) * 0.45) c = x < 15 ? 5 : 6;
    if (y === 27 && x >= 9 && x <= 23) c = 3;
    return c;
  } },
  { title: 'Space Station Wheel', palette: ['#d9e4ed', '#30364c', '#6c7baa', '#65c5ce', '#fff0ce', '#df9360'], paint(x: number, y: number) {
    const dx = x - 15.5; const dy = y - 17; const r = Math.hypot(dx, dy);
    let c = 0;
    if (r <= 14 && r >= 9) c = 1;
    if (r <= 13 && r >= 10) c = Math.abs(dx) < 4 || Math.abs(dy) < 4 ? 5 : 2;
    if (r < 11 && (Math.abs(dx - dy) < 1.6 || Math.abs(dx + dy) < 1.6)) c = 1;
    if (r < 10 && (Math.abs(dx - dy) < 0.8 || Math.abs(dx + dy) < 0.8)) c = 4;
    if (r <= 5) c = 1;
    if (r <= 3.5) c = 3;
    if (r <= 1.5) c = 4;
    if (r >= 11 && r <= 12 && (Math.abs(dx) < 2 || Math.abs(dy) < 2)) c = 3;
    return c;
  } },
];

// Grid sizes counted from the supplied reference. Level 36 has an open silhouette.
const sizes = [19, 30, 30, 32, 36, 32];
const wheelRows = [6, 12, 16, 18, 22, 24, 24, 26, 28, 28, 30, 30, 30, 32, 32, 32];
const previewSize = 288;
const preview = new PNG({ width: previewSize * 3, height: previewSize * 2 });
let seed = 3136;
const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
for (const [offset, design] of designs.entries()) {
  const id = 31 + offset;
  const width = sizes[offset]; const height = width;
  const pixels = Array.from({ length: width * height }, (_, i) => {
    const x = i % width; const y = Math.floor(i / width);
    if (id === 36) {
      const rowWidth = wheelRows[Math.min(y, height - 1 - y)];
      if (x < (width - rowWidth) / 2 || x >= (width + rowWidth) / 2) return -1;
    }
    return design.paint(Math.round((x + 0.5) * 32 / width - 0.5), Math.round((y + 0.5) * 36 / height - 0.5));
  });
  let level = generateLevel(id, width, height, levelPalette(id, design.palette), pixels, design.title, id === 31 ? 18 : 36);
  const source = level.lanes.map(lane => [...lane]);
  const sequence = level.solution!.map(lane => source[lane].shift()!);
  level.lanes = [[], [], [], []]; level.solution = [];
  let pairs = 0;
  sequence.forEach((crate, step) => {
    if (step >= 13 && step % 8 === 5 && crate.capacity >= 6 && pairs < 2) {
      const pairId = `level-${id}-pair-${++pairs}`; const first = Math.floor(crate.capacity / 2);
      level.lanes[1].push({ ...crate, capacity: first, pairId });
      level.lanes[2].push({ ...crate, capacity: crate.capacity - first, pairId }); level.solution!.push(1);
    } else { const lane = step % 4; level.lanes[lane].push(crate); level.solution!.push(lane); }
  });
  level.mysteryCells = [];
  // Two separated patches, always inside the board; collection reveals each orthogonal neighbor.
  const radius = id === 31 ? 2 : 3;
  for (const [cx, cy] of [[Math.floor(width * 0.25), Math.floor(height * 0.37)], [Math.floor(width * 0.7), Math.floor(height * 0.72)]]) {
    for (let y = cy - radius; y <= cy + radius; y++) for (let x = cx - radius; x <= cx + radius; x++) {
      const cell = y * width + x;
      if (x > 0 && x < width - 1 && y > 0 && y < height - 1 && [cell, cell - 1, cell + 1, cell - width, cell + width].every(index => pixels[index] >= 0)) level.mysteryCells.push(cell);
    }
  }
  level.blockGap = level.tileGap = 0.5; level.difficulty = levelDifficulty(id);
  level = mixLinkedColors(level);
  const hiddenCount = 4 + offset * 2;
  const buried = level.lanes.flatMap(lane => lane.slice(1));
  for (let i = 0; i < hiddenCount; i++) buried[Math.floor((i + 0.5) * buried.length / hiddenCount)].hidden = true;
  const original = structuredClone(level); const [min, max] = difficultyBands[level.difficulty!];
  const from = Number(process.argv.find(arg => arg.startsWith('--from='))?.split('=')[1] ?? 31);
  if (id < from) level = JSON.parse(await readFile(`levels/level_${id}.json`, 'utf8'));
  let accepted = false;
  for (let attempt = 0; id >= from && attempt < 2500; attempt++) {
    const candidate = structuredClone(original);
    const singles = candidate.lanes.flatMap(lane => lane.filter(crate => !crate.pairId));
    for (let swap = 0; swap < 1 + Math.floor(random() * 35); swap++) {
      const a = singles[Math.floor(random() * singles.length)]; const b = singles[Math.floor(random() * singles.length)];
      [a.color, b.color] = [b.color, a.color]; [a.capacity, b.capacity] = [b.capacity, a.capacity];
    }
    if (attempt % 2 === 0) {
      const board = new BoardModel(candidate);
      const exposedColors = new Set([...board.exposed].map(cell => board.cells[cell]));
      for (let lane = 1; lane < 4; lane++) {
        const head = candidate.lanes[lane][0];
        const blocked = singles.filter(crate => !exposedColors.has(crate.color));
        if (!blocked.length || head.pairId) continue;
        const donor = blocked[Math.floor(random() * blocked.length)];
        [head.color, donor.color] = [donor.color, head.color];
        [head.capacity, donor.capacity] = [donor.capacity, head.capacity];
      }
    }
    const quick = sample(candidate, 20, 913).wins * 5;
    if (quick < min - 15 || quick > max + 15) continue;
    const measured = sample(candidate, 100, 913);
    if (measured.wins < min || measured.wins > max) continue;
    const path = [measured.solution, ...measured.solutions].find(solution => verifySolution(candidate, solution).won) ?? findWinningSolution(candidate);
    if (!path) continue;
    candidate.solution = path; candidate.sampledWinRate = measured.wins; level = candidate; accepted = true; break;
  }
  if (id >= from && !accepted) throw new Error(`Could not tune level ${id}`);
  await writeFile(`levels/level_${id}.json`, JSON.stringify(level, null, 2) + '\n');
  for (let y = 0; y < previewSize; y++) for (let x = 0; x < previewSize; x++) {
    const color = pixels[Math.floor(y * height / previewSize) * width + Math.floor(x * width / previewSize)];
    const hex = color < 0 ? '#eee5ce' : level.palette[color];
    const target = (((Math.floor(offset / 3) * previewSize + y) * preview.width) + offset % 3 * previewSize + x) * 4;
    const shade = color >= 0 && (Math.floor(x * width / previewSize) !== Math.floor((x + 1) * width / previewSize) || Math.floor(y * height / previewSize) !== Math.floor((y + 1) * height / previewSize)) ? 0.8 : 1;
    for (let channel = 0; channel < 3; channel++) preview.data[target + channel] = parseInt(hex.slice(1 + channel * 2, 3 + channel * 2), 16) * shade;
    preview.data[target + 3] = 255;
  }
  console.log(`${id}: ${design.title}, ${level.mysteryCells!.length} mystery blocks, ${hiddenCount} hidden crates, ${level.sampledWinRate}% ${level.difficulty}`);
}
await mkdir('output/level-previews', { recursive: true });
await writeFile('output/level-previews/levels-31-36.png', PNG.sync.write(preview));
