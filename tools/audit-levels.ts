import fs from 'node:fs';
import { GameModel } from '../src/logic/GameModel';
import { validate, type LevelData } from '../src/logic/LevelData';

export function verifySolution(level: LevelData, solution = level.solution ?? []) {
  validate(level);
  const game = new GameModel(level);
  for (const [step, lane] of solution.entries()) {
    if (!game.placeCrate(lane)) return { won: false, step, remaining: game.board.remaining, reason: `Lane ${lane + 1} could not be placed (${game.state})` };
    for (let tick = 0; tick < 4000 && game.bots.size; tick++) game.update(50);
  }
  return { won: game.state === 'Won', remaining: game.board.remaining, reason: game.state };
}

export function findWinningSolution(level: LevelData): number[] | undefined {
  for (let trial = 0; trial < 8; trial++) {
    const game = new GameModel(level);
    const path: number[] = [];
    let seed = trial * 239 + level.id;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    for (let step = 0; step < 220 && game.state === 'Playing'; step++) {
      const choices = level.lanes.flatMap((_, lane) => {
        if (!game.dockModel.canPlace(lane)) return [];
        const columns = game.dockModel.placementLanes(lane);
        const score = columns.reduce((total, column) => {
          const crate = game.dockModel.peek(column)!;
          const available = [...game.board.exposed].filter(index => game.board.cells[index] === crate.color
            && !game.board.mysteryCells.has(index) && !game.board.reservations.has(index)).length;
          return total + Math.min(1, available / crate.capacity);
        }, 0) / columns.length;
        return [{ lane, score: score + random() * (trial < 4 ? 0.2 : 0.8) }];
      }).sort((a, b) => b.score - a.score);
      if (!choices.length) break;
      const lane = choices[0].lane;
      if (!game.placeCrate(lane)) break;
      path.push(lane);
      for (let tick = 0; tick < 4000 && game.bots.size; tick++) game.update(50);
    }
    if (game.state === 'Won') return path;
  }
}

if (process.argv[1]?.endsWith('audit-levels.ts')) {
  for (const file of fs.readdirSync('levels').filter(file => /^level_\d+\.json$/.test(file)).sort()) {
    const level = JSON.parse(fs.readFileSync(`levels/${file}`, 'utf8')) as LevelData;
    console.log(JSON.stringify({ id: level.id, title: level.title, ...verifySolution(level) }));
  }
}
