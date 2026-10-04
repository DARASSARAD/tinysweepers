import { readdir, readFile, writeFile } from 'node:fs/promises';
import type { CrateData, LevelData } from '../src/logic/LevelData';
import { verifySolution } from './audit-levels';

const files = (await readdir('levels')).filter(file => /^level_\d+\.json$/.test(file)).sort();
for (const file of files) {
  const path = `levels/${file}`;
  const original = JSON.parse(await readFile(path, 'utf8')) as LevelData;
  if (original.id < 10) continue;
  const queues = original.lanes.map(lane => lane.map(crate => ({ ...crate })));
  const units: { lanes: number[]; crates: CrateData[] }[] = [];
  for (const lane of original.solution!) {
    const crate = queues[lane].shift()!;
    const unit = { lanes: [lane], crates: [crate] };
    if (crate.pairId) {
      const partner = queues.findIndex(items => items[0]?.pairId === crate.pairId);
      if (partner < 0) throw new Error(`Missing pair in ${file}`);
      unit.lanes.push(partner);
      unit.crates.push(queues[partner].shift()!);
    }
    units.push(unit);
  }
  const merged: typeof units = [];
  for (const unit of units) {
    const previous = merged.at(-1);
    if (previous?.crates.length === 1 && unit.crates.length === 1
      && previous.crates[0].color === unit.crates[0].color
      && previous.crates[0].capacity + unit.crates[0].capacity <= 40) {
      previous.crates[0].capacity += unit.crates[0].capacity;
      previous.crates[0].hidden ||= unit.crates[0].hidden;
    } else merged.push(unit);
  }
  const level: LevelData = { ...original, lanes: original.lanes.map(() => []), solution: [] };
  merged.forEach(unit => {
    level.solution!.push(unit.lanes[0]);
    unit.crates.forEach((crate, i) => level.lanes[unit.lanes[i]].push(crate));
  });
  const hidden = original.lanes.flat().filter(crate => crate.hidden).length;
  level.lanes.flat().forEach(crate => { delete crate.hidden; });
  const buried = level.lanes.flatMap(lane => lane.slice(1));
  for (let i = 0; i < Math.min(hidden, buried.length); i++) {
    buried[Math.floor((i + 0.5) * buried.length / Math.min(hidden, buried.length))].hidden = true;
  }
  const result = verifySolution(level);
  if (!result.won) throw new Error(`Level ${level.id}: ${JSON.stringify(result)}`);
  await writeFile(path, JSON.stringify(level, null, 2) + '\n');
  console.log(`${level.id}: ${original.lanes.flat().length} -> ${level.lanes.flat().length} crates, max ${Math.max(...level.lanes.flat().map(c => c.capacity))} robots, verified win`);
}
