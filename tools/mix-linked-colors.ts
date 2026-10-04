import { readdir, readFile, writeFile } from 'node:fs/promises';
import type { LevelData } from '../src/logic/LevelData';
import { verifySolution } from './audit-levels';

export function mixLinkedColors(source: LevelData): LevelData {
  let level = source;
  const pairIds = [...new Set(level.lanes.flat().flatMap(crate => crate.pairId ? [crate.pairId] : []))];
  for (const pairId of pairIds) {
    const positions = level.lanes.flatMap((lane, column) => lane.flatMap((crate, depth) =>
      crate.pairId === pairId ? [{ column, depth }] : []));
    const [a, b] = positions;
    if (level.lanes[a.column][a.depth].color !== level.lanes[b.column][b.depth].color) continue;
    const donors = level.lanes.flatMap((lane, column) => lane.flatMap((crate, depth) =>
      !crate.pairId && crate.color !== level.lanes[a.column][a.depth].color ? [{ column, depth }] : []));
    for (const donor of donors) {
      const candidate: LevelData = { ...level, lanes: level.lanes.map(lane => lane.map(crate => ({ ...crate }))) };
      const target = candidate.lanes[b.column][b.depth];
      const single = candidate.lanes[donor.column][donor.depth];
      [target.color, single.color] = [single.color, target.color];
      [target.capacity, single.capacity] = [single.capacity, target.capacity];
      if (!verifySolution(candidate).won) continue;
      level = candidate;
      break;
    }
  }
  return level;
}

if (process.argv[1]?.endsWith('mix-linked-colors.ts')) {
  for (const file of (await readdir('levels')).filter(file => /^level_\d+\.json$/.test(file))) {
    const path = `levels/${file}`;
    const source = JSON.parse(await readFile(path, 'utf8')) as LevelData;
    if (source.id < 14) continue;
    const level = mixLinkedColors(source);
    if (!verifySolution(level).won) throw new Error(`Level ${level.id} needs a winning route with linked docks`);
    delete level.sampledWinRate;
    await writeFile(path, JSON.stringify(level, null, 2) + '\n');
    const pairIds = [...new Set(level.lanes.flat().flatMap(crate => crate.pairId ? [crate.pairId] : []))];
    const mixed = pairIds.filter(id => new Set(level.lanes.flat().filter(crate => crate.pairId === id).map(crate => crate.color)).size === 2).length;
    console.log(`${level.id}: ${mixed}/${pairIds.length} mixed-color pairs, winning route verified`);
  }
}
