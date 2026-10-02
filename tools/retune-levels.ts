import fs from 'node:fs';
import { BoardModel } from '../src/logic/BoardModel';
import type { CrateData, LevelData } from '../src/logic/LevelData';
import { verifySolution } from './audit-levels';
import { generateLevel } from './level-generator/Generate';

const medium = new Set([10, 14, 16]);
for (const file of fs.readdirSync('levels').filter(file => /^level_\d+\.json$/.test(file)).sort()) {
  const path = `levels/${file}`;
  const original = JSON.parse(fs.readFileSync(path, 'utf8')) as LevelData;
  if (!verifySolution(original).won) throw new Error(`Original level ${original.id} needs repair first`);
  const source = medium.has(original.id) ? generateLevel(original.id, original.width, original.height,
    original.palette, original.pixels, original.title ?? `Level ${original.id}`,
    Math.max(...original.lanes.flat().map(crate => crate.capacity))) : original;
  const queues = source.lanes.map(lane => [...lane]);
  const sequence = source.solution!.map(lane => queues[lane].shift()!);
  const columnCount = original.id < 6 ? 3 : 4;
  const arrange = (order: CrateData[]) => {
    const lanes: CrateData[][] = Array.from({ length: columnCount }, () => []);
    const solution = order.map((crate, index) => {
      const lane = (index + original.id) % columnCount;
      lanes[lane].push({ ...crate });
      return lane;
    });
    return { ...original, lanes, solution };
  };
  let level = arrange(sequence);
  let earlyWaiting = 0;
  if (medium.has(original.id)) {
    const board = new BoardModel(original);
    // Promote two later crates with scarce initial matches. These occupy docks
    // while the player finds the clearing colors in the other columns.
    const exposed = original.palette.map((_, color) =>
      [...board.exposed].filter(index => board.cells[index] === color).length);
    const candidates = sequence.map((crate, index) => ({ crate, index }))
      .filter(({ index }) => index >= 4)
      .sort((a, b) => exposed[a.crate.color] / a.crate.capacity - exposed[b.crate.color] / b.crate.capacity || a.index - b.index);
    outer: for (let a = 0; a < candidates.length; a++) {
      for (let b = a + 1; b < candidates.length; b++) {
        const chosen = [candidates[a], candidates[b]];
        const indices = new Set(chosen.map(item => item.index));
        const proposed = arrange([...chosen.map(item => item.crate), ...sequence.filter((_, i) => !indices.has(i))]);
        if (!verifySolution(proposed).won) continue;
        level = proposed;
        earlyWaiting = chosen.filter(item => item.crate.capacity > exposed[item.crate.color]).length;
        break outer;
      }
    }
    level.lanes.forEach((lane, column) => lane.forEach((crate, depth) => {
      crate.hidden = depth > 0 && (depth + column) % 4 === 2;
    }));
  }
  if (!verifySolution(level).won) throw new Error(`Level ${level.id} failed final verification`);
  fs.writeFileSync(path, JSON.stringify(level, null, 2) + '\n');
  console.log(`Level ${level.id}: ${columnCount} columns, ${medium.has(level.id) ? 'medium' : 'standard'}, ${earlyWaiting} early waiting crates, verified win`);
}
