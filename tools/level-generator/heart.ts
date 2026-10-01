import { writeFile } from 'node:fs/promises';
import { Config } from '../../src/core/Config';
import { GameModel } from '../../src/logic/GameModel';
import { solve } from '../../src/logic/Solver';
import { generateLevel } from './Generate';

// Trace the supplied reference's block grid, excluding its text overlay.
const rows = [
  '...PPPP.....PPPP...',
  '..PPPPPP...PPPPPP..',
  '.PPPPPPPP.PPPPPPPP.',
  'PPPCCPPPPPPPPPCCPPP',
  'PPCCCCPPPPPPPCCCCPP',
  'PCCCCCCPPPPPCCCCCCP',
  'CCCCCCCCCPCCCCCCCCC',
  'CCCCCCCYCCCYCCCCCCC',
  'CCCCCCYYYCYYYCCCCCC',
  '.CCCCYYYYCYYYYCCCC.',
  '.CCCCCYYYCYYYCCCCC.',
  '..CCCCCYCCCYCCCCC..',
  '...PPPCCCCCCCPPP...',
  '....PPPPPCPPPPP....',
  '.....PPPPPPPPP.....',
  '......PPPPPPP......',
  '.......PPPPP.......',
  '........PPP........',
  '.........P.........',
];
const colors: Record<string, number> = { '.': -1, P: 0, C: 1, Y: 2 };
if (rows.some(row => row.length !== rows.length)) throw new Error('Heart rows must form a square grid');
const level = generateLevel(1, rows.length, rows.length, ['#ed55c5', '#63d6e3', '#f7d357'],
  rows.flatMap(row => [...row].map(symbol => colors[symbol])), 'Starlight heart', Config.levels.lateCapacity);
const result = solve(level);
if (result.status !== 'solvable') throw new Error(`Heart solver result: ${result.status}`);
const game = new GameModel(level);
for (const lane of level.solution!) {
  if (!game.placeCrate(lane)) throw new Error('Heart solution placement failed');
  for (let tick = 0; tick < Config.levels.settleSteps && game.bots.size; tick++) game.update(Config.motion.maxFrameMs);
}
if (game.state !== 'Won') throw new Error('Heart did not pass the real-timing simulation');
await writeFile('levels/level_001.json', `${JSON.stringify(level, null, 2)}\n`);
console.log(`Starlight heart: ${level.pixels.filter(c => c >= 0).length} cubes, ${level.lanes.flat().length} crates, verified solvable`);
