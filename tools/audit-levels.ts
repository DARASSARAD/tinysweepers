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

if (process.argv[1]?.endsWith('audit-levels.ts')) {
  for (const file of fs.readdirSync('levels').filter(file => /^level_\d+\.json$/.test(file)).sort()) {
    const level = JSON.parse(fs.readFileSync(`levels/${file}`, 'utf8')) as LevelData;
    console.log(JSON.stringify({ id: level.id, title: level.title, ...verifySolution(level) }));
  }
}
