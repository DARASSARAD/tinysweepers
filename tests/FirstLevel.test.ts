import { expect, it } from 'vitest';
import { levels } from '../src/logic/Levels';
import { GameModel } from '../src/logic/GameModel';
import { sample } from '../tools/tune-difficulty';

const level = levels.find(item => item.id === 1)!;

it('starts with a collectible front crate so the tutorial can highlight it', () => {
  const game = new GameModel(level);
  expect(game.dockModel.lanes.some(lane => game.board.canClaim(lane[0].color))).toBe(true);
  expect(level.lanes.flat().length).toBeGreaterThan(3);
  expect(level.lanes.every(lane => lane.length > 1)).toBe(true);
  expect(level.lanes.flat().every(crate => crate.capacity <= 6)).toBe(true);
});

it('wins all 100 sampled crate-choice runs with small crates', () => {
  expect(sample(level, 100, 913).wins).toBe(100);
});

it.each([1, 2, 3, 4, 5, 6])('wins with actual bot timing for random choices, seed %i', seed => {
    const game = new GameModel(level);
    let randomState = seed;
    for (let step = 0; step < 150 && game.state === 'Playing'; step++) {
      const choices = level.lanes.map((_, lane) => lane).filter(lane => game.dockModel.canPlace(lane));
      expect(choices.length).toBeGreaterThan(0);
      randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
      const lane = choices[Math.floor(randomState / 4294967296 * choices.length)];
      expect(game.placeCrate(lane)).toBe(true);
      for (let tick = 0; tick < 4000 && game.bots.size; tick++) game.update(50);
      expect(game.state).not.toBe('Lost');
    }
    expect(game.state).toBe('Won');
    expect(game.board.remaining).toBe(0);
});
