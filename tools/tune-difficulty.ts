import { readFile, writeFile, readdir } from 'node:fs/promises';
import { BoardModel } from '../src/logic/BoardModel';
import { DockModel } from '../src/logic/DockModel';
import type { LevelData } from '../src/logic/LevelData';
import { verifySolution } from './audit-levels';
import { difficultyBands, levelDifficulty } from '../src/logic/Difficulty';
import { Config } from '../src/core/Config';

export function sample(level: LevelData, runs: number, seed: number) {
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  let wins = 0;
  let solution: number[] = [];
  const solutions: number[][] = [];
  for (let run = 0; run < runs; run++) {
    const board = new BoardModel(level);
    const docks = new DockModel(level.lanes, level.dockCount);
    const path: number[] = [];
    let bot = 0;
    for (let step = 0; step < 150 && board.remaining; step++) {
      const choices = level.lanes.map((_, lane) => lane).filter(lane => docks.canPlace(lane));
      if (!choices.length) break;
      const lane = choices[Math.floor(random() * choices.length)];
      docks.place(lane);
      path.push(lane);
      let progress = true;
      while (progress) {
        progress = false;
        docks.docks.forEach((crate, dock) => {
          if (!crate) return;
          while (crate.atDock) {
            const cell = board.tryClaim(crate.color, bot);
            if (cell === null) break;
            board.remove(cell, bot++);
            crate.atDock--;
            progress = true;
          }
          docks.free(dock);
        });
      }
    }
    if (!board.remaining) { wins++; solution = path; if (solutions.length < 12) solutions.push(path); }
  }
  return { wins, solution, solutions };
}
// A reproducible settled random-choice proxy, not a measured human win rate.
if (process.argv[1]?.endsWith('tune-difficulty.ts')) {
const files = (await readdir('levels')).filter(file => /^level_\d+\.json$/.test(file));
for (const filename of files) {
  const path = `levels/${filename}`;
  const original = JSON.parse(await readFile(path, 'utf8')) as LevelData;
  const requestedLevel = process.argv.find(arg => arg.startsWith('--level='));
  if (requestedLevel && original.id !== Number(requestedLevel.split('=')[1])) continue;
  if (original.dockCount !== Config.dockCount) {
    original.dockCount = Config.dockCount;
    delete original.sampledWinRate;
  }
  const id = original.id;
  // The introductory level intentionally sits outside the normal Easy band.
  if (id === 1) continue;
  const fromLevel = process.argv.find(arg => arg.startsWith('--from='));
  if (fromLevel && id < Number(fromLevel.split('=')[1])) continue;
  const toLevel = process.argv.find(arg => arg.startsWith('--to='));
  if (toLevel && id > Number(toLevel.split('=')[1])) continue;
  const difficulty = levelDifficulty(id, original.difficulty);
  const requestedDifficulty = process.argv.find(arg => arg.startsWith('--difficulty='));
  if (requestedDifficulty && difficulty !== requestedDifficulty.split('=')[1]) continue;
  const [min, max] = difficultyBands[difficulty];
  const target = (min + max) / 2;
  if (process.argv.includes('--measure')) {
    if (original.sampledWinRate === undefined) {
      original.sampledWinRate = sample(original, 100, 913).wins;
      if (!verifySolution(original).won) throw new Error(`Level ${id} has no verified solution`);
      await writeFile(path, JSON.stringify(original, null, 2) + '\n');
      console.log(`${id}: restored ${Config.dockCount} docks, sampled ${original.sampledWinRate}%`);
    }
    continue;
  }
  if (original.difficulty === difficulty && original.sampledWinRate !== undefined
    && original.sampledWinRate >= min && original.sampledWinRate <= max && verifySolution(original).won) {
    console.log(`${id}: retained verified ${difficulty}, ${original.sampledWinRate}%`);
    continue;
  }
  const baseline = sample(original, 100, 913);
  let best: LevelData | null = null;
  if (baseline.wins >= min && baseline.wins <= max && verifySolution(original).won) best = original;
  let seed = id * 199;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const attemptLimit = Number(process.argv.find(arg => arg.startsWith('--attempts='))?.split('=')[1] ?? 1500);
  for (let attempt = 0; !best && attempt < attemptLimit; attempt++) {
    const candidate: LevelData = { ...original, lanes: original.lanes.map(lane => lane.map(crate => ({ ...crate }))) };
    // Small early shipments can create meaningful choices without changing the picture.
    if (id < 10 && difficulty === 'Easy' && attempt >= 40) {
      const board = new BoardModel(candidate);
      for (let split = 0; split < 1 + attempt % 6; split++) {
        const shipments = candidate.lanes.flatMap((lane, column) => lane.flatMap((crate, depth) =>
          !crate.pairId && crate.capacity > 1 ? [{ column, depth, blocked: !board.canClaim(crate.color) }] : []));
        const blocked = shipments.filter(slot => slot.blocked);
        const choices = blocked.length ? blocked : shipments;
        const slot = choices[Math.floor(random() * choices.length)];
        if (!slot) break;
        const lane = candidate.lanes[slot.column];
        const crate = lane[slot.depth];
        const capacity = Math.max(1, Math.floor(crate.capacity / 2));
        crate.capacity -= capacity;
        lane.splice(slot.depth + 1, 0, { color: crate.color, capacity });
      }
    }
    if (attempt % 20 === 0) console.log(`${id}: searching ${difficulty}, attempt ${attempt}`);
    const singles = candidate.lanes.flatMap((lane, column) => lane.flatMap((crate, depth) => crate.pairId ? [] : [{ column, depth }]));
    for (let swap = 0; swap < 1 + attempt % 50; swap++) {
      const a = singles[Math.floor(random() * singles.length)];
      const b = singles[Math.floor(random() * singles.length)];
      if (a && b) {
        const left = candidate.lanes[a.column]; const right = candidate.lanes[b.column];
        [left[a.depth], right[b.depth]] = [right[b.depth], left[a.depth]];
      }
    }
    // Hard boards need competing early shipments, while retaining an escape lane.
    if ((difficulty === 'Hard' || difficulty === 'Easy') && attempt % 2 === 0) {
      const board = new BoardModel(candidate);
      for (let column = 1; column < candidate.lanes.length; column++) {
        for (let depth = 0; depth < 1 + attempt % 3; depth++) {
          const head = candidate.lanes[column][depth];
          if (!head || head.pairId) continue;
          const blocked = singles.filter(slot => slot.depth > 3
            && !board.canClaim(candidate.lanes[slot.column][slot.depth].color));
          const donor = blocked[Math.floor(random() * blocked.length)];
          if (!donor) continue;
          const lane = candidate.lanes[donor.column];
          [candidate.lanes[column][depth], lane[donor.depth]] = [lane[donor.depth], head];
        }
      }
    }
    const hidden = candidate.lanes.flat().filter(crate => crate.hidden).length;
    candidate.lanes.flat().forEach(crate => { delete crate.hidden; });
    const buried = candidate.lanes.flatMap(lane => lane.slice(1));
    for (let i = 0; i < hidden; i++) buried[Math.floor((i + 0.5) * buried.length / hidden)].hidden = true;
    const preview = sample(candidate, 20, 913);
    if (attempt % 20 === 0) console.log(`${id}: preview ${preview.wins}/20, ${candidate.dockCount} docks`);
    if (Math.abs(preview.wins * 5 - target) > 20) continue;
    const result = sample(candidate, 100, 913);
    if (result.wins < min || result.wins > max) continue;
    candidate.solution = result.solution;
    if (!verifySolution(candidate).won) continue;
    best = candidate;
  }
  if (!best) {
    if (process.argv.includes('--continue-on-failure')) {
      console.log(`${id}: queue-only tuning did not reach ${min}-${max}%; kept original layout`);
      continue;
    }
    throw new Error(`No verified ${difficulty} layout for level ${id}`);
  }
  best.difficulty = difficulty;
  best.sampledWinRate = sample(best, 100, 913).wins;
  await writeFile(path, JSON.stringify(best, null, 2) + '\n');
  console.log(`${id}: ${difficulty}, ${baseline.wins}% -> ${best.sampledWinRate}%, solution verified`);
}
}
