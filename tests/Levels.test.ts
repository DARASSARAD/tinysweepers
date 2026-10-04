import { describe, expect, it } from 'vitest';
import { GameModel } from '../src/logic/GameModel';
import { levels } from '../src/logic/Levels';
import { validate } from '../src/logic/LevelData';
import { cubeAccessRoute } from '../src/logic/RobotRoute';

describe('authored starter levels', () => {
  it.each(levels)('level $id has five base docks', level => {
    expect(level.dockCount).toBe(5);
  });
  it.each(levels)('level $id uses the campaign crate column count', level => {
    expect(level.lanes).toHaveLength(level.id < 6 ? 3 : 4);
    expect(level.lanes.every(lane => lane.length > 0)).toBe(true);
  });
  it.each([10, 14, 16, 19])('level %i includes some concealed queue choices', id => {
    const level = levels.find(level => level.id === id)!;
    expect(level.lanes.flat().some(crate => crate.hidden)).toBe(true);
    expect(level.lanes.every(lane => !lane[0].hidden)).toBe(true);
  });
  it('level 19 combines mystery crates with connected pairs', () => {
    const level = levels.find(level => level.id === 19)!;
    expect(level.lanes.flat().filter(crate => crate.pairId).length).toBeGreaterThanOrEqual(4);
  });
  it.each(levels)('level $id validates and can be won using real bot timing', level => {
    validate(level);
    const game = new GameModel(level);
    const checkedBots = new Set<number>();
    const update = () => {
      for (const bot of game.bots.values()) {
        if (checkedBots.has(bot.id)) continue;
        expect(cubeAccessRoute(game.board.cells, level.width, level.height, bot.cell).length,
          `Level ${level.id}, robot ${bot.id} needs a clear route`).toBeGreaterThan(0);
        checkedBots.add(bot.id);
      }
      game.update(50);
    };
    if (level.solution) {
      for (const lane of level.solution) {
        expect(game.placeCrate(lane)).toBe(true);
        for (let tick = 0; tick < 4000 && game.bots.size; tick++) update();
      }
    }
    for (let step = 0; step < 4000 && game.state === 'Playing'; step++) {
      for (let lane = 0; lane < level.lanes.length; lane++) {
        const crate = game.dockModel.peek(lane);
        if (crate && game.board.canClaim(crate.color)) game.placeCrate(lane);
      }
      update();
    }
    expect(game.state).toBe('Won');
    expect(game.board.remaining).toBe(0);
  });
  it('the mixed-order tutorial leaves inner-color crates waiting until the border is cleared', () => {
    const game = new GameModel({ id: 1, width: 8, height: 8, palette: ['#ffffff', '#000000'], dockCount: 5,
      pixels: Array.from({ length: 64 }, (_, index) => {
        const x = index % 8;
        const y = Math.floor(index / 8);
        return x === 0 || x === 7 || y === 0 || y === 7 ? 0 : 1;
      }),
      lanes: [[{ color: 1, capacity: 18 }, { color: 0, capacity: 28 }], [{ color: 1, capacity: 18 }]],
    });
    expect(game.placeCrate(0)).toBe(true);
    expect(game.placeCrate(1)).toBe(true);
    expect(game.board.remaining).toBe(64);
    expect(game.bots.size).toBe(0);
    expect(game.state).toBe('Playing');
  });
});
