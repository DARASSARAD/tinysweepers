import { readFile, writeFile } from 'node:fs/promises';
import type { LevelData } from '../src/logic/LevelData';
import { sample } from './tune-difficulty';
import { verifySolution } from './audit-levels';
const path = 'levels/level_014.json';
const level = JSON.parse(await readFile(path, 'utf8')) as LevelData;
let saved = false;
for (let from = 0; !saved && from < level.lanes[1].length; from++) {
  if (level.lanes[1][from].pairId) continue;
  for (let to = 0; !saved && to < level.lanes[1].length; to++) {
    const candidate: LevelData = { ...level, lanes: level.lanes.map(lane => lane.map(crate => ({ ...crate }))) };
    const [crate] = candidate.lanes[1].splice(from, 1);
    candidate.lanes[1].splice(to, 0, crate);
    const depths = new Map<string, number[]>();
    candidate.lanes.forEach(lane => lane.forEach((item, depth) => {
      if (item.pairId) depths.set(item.pairId, [...(depths.get(item.pairId) ?? []), depth]);
    }));
    if (![...depths.values()].some(([a, b]) => a !== b)) continue;
    if (candidate.lanes.some(lane => lane[0]?.hidden)) continue;
    const result = sample(candidate, 100, 913);
    if (result.wins < 60 || result.wins > 80) continue;
    candidate.solution = result.solution; candidate.sampledWinRate = result.wins;
    if (!verifySolution(candidate).won) continue;
    await writeFile(path, JSON.stringify(candidate, null, 2) + '\n');
    saved = true;
    console.log(`14: restored staggered pair, ${result.wins}%`);
  }
}
if (!saved) throw new Error('Could not preserve a staggered pair');
