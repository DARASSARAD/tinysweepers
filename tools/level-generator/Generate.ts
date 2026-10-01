import { Config } from '../../src/core/Config';
import { BoardModel } from '../../src/logic/BoardModel';
import { validate, type CrateData, type LevelData } from '../../src/logic/LevelData';

export function generateLevel(id: number, width: number, height: number, palette: string[], pixels: number[], title: string, maxCapacity: number = Config.levels.earlyCapacity): LevelData {
  const level: LevelData = { id, width, height, palette, pixels, title, lanes: [], dockCount: Config.dockCount, solution: [] };
  const board = new BoardModel(level);
  const sequence: CrateData[] = [];
  let botId = 0;
  while (board.remaining > 0) {
    const colors = palette.map((_, color) => ({ color, exposed: [...board.exposed].filter(index => board.cells[index] === color).length }));
    colors.sort((a, b) => b.exposed - a.exposed || ((a.color + id) % palette.length) - ((b.color + id) % palette.length));
    const color = colors[0].color;
    let capacity = 0;
    while (capacity < maxCapacity) {
      const claim = board.tryClaim(color, botId);
      if (claim === null) break;
      board.remove(claim, botId++);
      capacity++;
    }
    if (capacity === 0) throw new Error('Could not construct a peeling sequence');
    sequence.push({ color, capacity });
  }
  level.lanes = Array.from({ length: Config.levels.laneCount }, () => []);
  sequence.forEach((crate, index) => {
    const lane = (index + id) % level.lanes.length;
    level.lanes[lane].push(crate);
    level.solution!.push(lane);
  });
  validate(level);
  return level;
}
