import fs from 'node:fs';
import type { LevelData } from '../src/logic/LevelData';
import { verifySolution } from './audit-levels';

for (let id = 14; id <= 18; id++) {
  const path = `levels/level_${String(id).padStart(3, '0')}.json`;
  const level = JSON.parse(fs.readFileSync(path, 'utf8')) as LevelData;
  const queues = level.lanes.map(lane => [...lane]);
  const original: number[] = [];
  for (const lane of level.solution!) {
    const crate = queues[lane].shift()!;
    original.push(lane);
    if (crate.pairId) {
      const partner = queues.findIndex((items, column) => column !== lane && items[0]?.pairId === crate.pairId);
      if (partner < 0) throw new Error(`Unreachable pair in level ${id}`);
      queues[partner].shift();
      original.push(partner);
    }
  }
  level.lanes.flat().forEach(crate => { delete crate.pairId; });
  const depths = level.lanes.map(() => 0);
  const candidates: { step: number; leftDepth: number; rightDepth: number }[] = [];
  original.forEach((lane, step) => {
    const partner = original[step + 1];
    if (partner !== undefined && Math.abs(lane - partner) === 1) {
      candidates.push({ step, leftDepth: depths[lane], rightDepth: depths[partner] });
    }
    depths[lane]++;
  });
  const selected = new Set<number>();
  const available = (step: number) => !selected.has(step) && !selected.has(step - 1) && !selected.has(step + 1);
  // Include a staggered pair when the queue order permits it, then spread
  // the other pairs throughout the level instead of clustering at its start.
  const staggered = candidates.find(item => item.leftDepth !== item.rightDepth && item.step > 3);
  if (staggered) selected.add(staggered.step);
  for (const fraction of [0, 0.25, 0.5, 0.75]) {
    const candidate = candidates.filter(item => available(item.step))
      .sort((a, b) => Math.abs(a.step - original.length * fraction) - Math.abs(b.step - original.length * fraction))[0];
    if (candidate) selected.add(candidate.step);
  }
  depths.fill(0);
  const solution: number[] = [];
  let pairs = 0;
  for (let step = 0; step < original.length; step++) {
    const lane = original[step];
    solution.push(lane);
    const crate = level.lanes[lane][depths[lane]++];
    if (!selected.has(step)) continue;
    const partner = original[++step];
    const other = level.lanes[partner][depths[partner]++];
    crate.pairId = other.pairId = `level-${id}-pair-${++pairs}`;
  }
  level.solution = solution;
  const result = verifySolution(level);
  if (!pairs || !result.won) throw new Error(`Level ${id}: ${JSON.stringify(result)}`);
  fs.writeFileSync(path, JSON.stringify(level, null, 2) + '\n');
  console.log(`Level ${id}: ${pairs} pairs spread through the queue, staggered: ${Boolean(staggered)}, verified win`);
}
