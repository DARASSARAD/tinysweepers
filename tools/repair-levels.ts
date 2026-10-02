import fs from 'node:fs';
import { generateLevel } from './level-generator/Generate';
import { verifySolution } from './audit-levels';
import type { LevelData } from '../src/logic/LevelData';

for (const file of fs.readdirSync('levels').filter(file => /^level_\d+\.json$/.test(file)).sort()) {
  const path = `levels/${file}`;
  const level = JSON.parse(fs.readFileSync(path, 'utf8')) as LevelData;
  if (verifySolution(level).won) continue;
  const capacity = Math.max(...level.lanes.flat().map(crate => crate.capacity));
  const generated = generateLevel(level.id, level.width, level.height, level.palette, level.pixels, level.title ?? `Room ${level.id}`, capacity);
  // Keep the existing number of columns and distribute a proven peeling sequence.
  const sequence = generated.solution!.map(lane => generated.lanes[lane].shift()!);
  const lanes = Array.from({ length: level.lanes.length }, () => [] as LevelData['lanes'][number]);
  const solution = sequence.map((crate, index) => {
    const lane = (index + level.id) % lanes.length;
    lanes[lane].push(crate);
    return lane;
  });
  const repaired = { ...level, lanes, solution };
  const result = verifySolution(repaired);
  if (!result.won) throw new Error(`Repair failed for level ${level.id}: ${JSON.stringify(result)}`);
  fs.writeFileSync(path, JSON.stringify(repaired, null, 2) + '\n');
  console.log(`Repaired level ${level.id}: ${sequence.length} crates, verified win.`);
}
