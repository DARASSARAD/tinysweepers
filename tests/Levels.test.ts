import { describe, expect, it } from 'vitest';
import { GameModel } from '../src/logic/GameModel';
import { levels } from '../src/logic/Levels';
import { validate } from '../src/logic/LevelData';

describe('authored starter levels', () => {
  it.each(levels)('level $id validates and can be won using real bot timing', level => {
    validate(level);
    const game = new GameModel(level);
    if (level.solution) {
      for (const lane of level.solution) {
        expect(game.placeCrate(lane)).toBe(true);
        for (let tick = 0; tick < 4000 && game.bots.size; tick++) game.update(50);
      }
    }
    for (let step = 0; step < 4000 && game.state === 'Playing'; step++) {
      for (let lane = 0; lane < level.lanes.length; lane++) {
        const crate = game.dockModel.peek(lane);
        if (crate && game.board.canClaim(crate.color)) game.placeCrate(lane);
      }
      game.update(50);
    }
    expect(game.state).toBe('Won');
    expect(game.board.remaining).toBe(0);
  });
  it('level 3 punishes filling all docks with inner colors', () => {
    const game = new GameModel(levels[2]);
    expect(game.placeCrate(0)).toBe(true);
    expect(game.placeCrate(1)).toBe(true);
    expect(game.board.remaining).toBe(64);
    expect(game.bots.size).toBe(0);
    expect(game.state).toBe('Playing');
  });
});
