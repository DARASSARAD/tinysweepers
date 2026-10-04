import { readdir, readFile, writeFile } from 'node:fs/promises';
import type { LevelData } from '../src/logic/LevelData';
import { generateLevel } from './level-generator/Generate';
import { mixLinkedColors } from './mix-linked-colors';
import { sample } from './tune-difficulty';
import { findWinningSolution, verifySolution } from './audit-levels';
import { execFileSync } from 'node:child_process';

for (const file of (await readdir('levels')).filter(file => /^level_\d+\.json$/.test(file))) {
  const path = `levels/${file}`;
  const original = JSON.parse(await readFile(path, 'utf8')) as LevelData;
  const only = process.argv.find(arg => arg.startsWith('--level='));
  if (only && original.id !== Number(only.split('=')[1])) continue;
  if (original.difficulty !== 'Easy' || (!process.argv.includes('--force') && original.sampledWinRate! >= 60 && original.sampledWinRate! <= 80)) continue;
  if (original.id === 1) original.pixels = (JSON.parse(execFileSync('git', ['show', 'HEAD:levels/level_001.json'], { encoding: 'utf8' })) as LevelData).pixels;
  const counts = original.palette.map((_, color) => original.pixels.filter(c => c === color).length);
  const accent = counts.indexOf(Math.min(...counts.filter(n => n > 0)));
  const centers = original.pixels.flatMap((color, index) => {
    const x = index % original.width; const y = Math.floor(index / original.width);
    if (color < 0 || x < 2 || x >= original.width - 2 || y < 2 || y >= original.height - 2) return [];
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      if (original.pixels[(y + dy) * original.width + x + dx] < 0) return [];
    }
    return [{ x, y, distance: Math.abs(x - original.width / 2) + Math.abs(y - original.height / 2) }];
  }).sort((a, b) => a.distance - b.distance);
  const pairs = new Set(original.lanes.flat().flatMap(crate => crate.pairId ? [crate.pairId] : [])).size;
  let seed = original.id * 431;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  let best: LevelData | undefined;
  for (let variant = 0; !best && variant < Math.min(12, centers.length); variant++) {
    console.log(`${original.id}: constructing interior ${variant}`);
    const { x, y } = centers[variant];
    const pixels = [...original.pixels];
    const ringColors = original.palette.map((_, c) => ({ color: c,
      count: [-2, -1, 0, 1, 2].flatMap(dy => [-2, -1, 0, 1, 2].filter(dx => Math.abs(dx) === 2 || Math.abs(dy) === 2)
        .map(dx => pixels[(y + dy) * original.width + x + dx])).filter(color => color === c).length }));
    const surround = ringColors.filter(c => c.color !== accent).sort((a, b) => b.count - a.count)[0].color;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      pixels[(y + dy) * original.width + x + dx] = Math.abs(dx) === 2 || Math.abs(dy) === 2 ? surround : accent;
    }
    if (original.id === 1) {
      pixels.splice(0, pixels.length, ...original.pixels);
      for (let index = 0; index < pixels.length; index++) {
        if (original.pixels[index] !== 1 || index === 9 * 19 + 9) continue;
        const px = index % 19;
        const neighbors = [index - 19, index + 19, ...(px > 0 ? [index - 1] : []), ...(px < 18 ? [index + 1] : [])];
        if (neighbors.some(neighbor => original.pixels[neighbor] === 2)) pixels[index] = 0;
      }
    }
    const base = generateLevel(original.id, original.width, original.height, original.palette, pixels,
      original.title!, Math.max(...original.lanes.flat().map(c => c.capacity)));
    const queues = base.lanes.map(lane => [...lane]);
    const sequence = base.solution!.flatMap(lane => {
      const crate = queues[lane].shift()!;
      return crate.color === accent ? Array.from({ length: crate.capacity }, () => ({ color: accent, capacity: 1 })) : [crate];
    });
    base.lanes = original.lanes.map(() => []); base.solution = [];
    let added = 0;
    sequence.forEach((crate, step) => {
      if (step >= 13 && crate.capacity >= 2 && added < pairs) {
        const pairId = `level-${original.id}-pair-${++added}`;
        const first = Math.floor(crate.capacity / 2);
        base.lanes[1].push({ color: crate.color, capacity: first, pairId });
        base.lanes[2].push({ color: crate.color, capacity: crate.capacity - first, pairId });
        base.solution!.push(1);
      } else {
        const lane = step % base.lanes.length;
        base.lanes[lane].push(crate); base.solution!.push(lane);
      }
    });
    if (added !== pairs || !verifySolution(base).won) continue;
    const mixed = mixLinkedColors(base);
    for (let attempt = 0; !best && attempt < 80; attempt++) {
      const candidate: LevelData = { ...mixed, lanes: mixed.lanes.map(lane => lane.map(crate => ({ ...crate }))) };
      const slots = candidate.lanes.flatMap((lane, column) => lane.flatMap((crate, depth) => crate.pairId ? [] : [{ column, depth }]));
      for (let swap = 0; swap < 1 + attempt % 40; swap++) {
        const a = slots[Math.floor(random() * slots.length)], b = slots[Math.floor(random() * slots.length)];
        [candidate.lanes[a.column][a.depth], candidate.lanes[b.column][b.depth]] = [candidate.lanes[b.column][b.depth], candidate.lanes[a.column][a.depth]];
      }
      if (attempt % 2 === 0) {
        for (let column = 1; column < candidate.lanes.length; column++) {
          for (let depth = 0; depth < 1 + attempt % 4; depth++) {
            const target = candidate.lanes[column][depth];
            if (!target || target.pairId) continue;
            const donors = slots.filter(slot => slot.depth >= 4
              && candidate.lanes[slot.column][slot.depth].color === accent);
            const donor = donors[Math.floor(random() * donors.length)];
            if (donor) [candidate.lanes[column][depth], candidate.lanes[donor.column][donor.depth]] =
              [candidate.lanes[donor.column][donor.depth], target];
          }
        }
      }
      const preview = sample(candidate, 20, 913);
      if (attempt % 20 === 0) console.log(`${original.id}: attempt ${attempt}, preview ${preview.wins}/20`);
      if (preview.wins < 9 || preview.wins > 18) continue;
      const result = sample(candidate, 100, 913);
      if (result.wins < 60 || result.wins > 80) continue;
      candidate.solution = result.solution;
      if (!verifySolution(candidate).won) {
        const winning = result.solutions.find(path => verifySolution(candidate, path).won) ?? findWinningSolution(candidate);
        if (!winning) continue;
        candidate.solution = winning;
      }
      candidate.difficulty = 'Easy'; candidate.sampledWinRate = result.wins;
      candidate.blockGap = original.blockGap; candidate.tileGap = original.tileGap;
      const hidden = original.lanes.flat().filter(crate => crate.hidden).length;
      const buried = candidate.lanes.flatMap(lane => lane.slice(1));
      for (let i = 0; i < hidden; i++) buried[Math.floor((i + 0.5) * buried.length / hidden)].hidden = true;
      best = candidate;
    }
    console.log(`${original.id}: interior variant ${variant}, ${best ? best.sampledWinRate + '%' : 'searching'}`);
  }
  if (!best) throw new Error(`Could not tune level ${original.id} with an interior region`);
  await writeFile(path, JSON.stringify(best, null, 2) + '\n');
}
