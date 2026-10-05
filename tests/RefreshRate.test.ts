import { expect, it } from 'vitest';
import { GameModel } from '../src/logic/GameModel';
import type { LevelData } from '../src/logic/LevelData';

const level: LevelData = {
  id: 1, width: 2, height: 2, palette: ['#ffffff'], pixels: [0, 0, 0, 0],
  lanes: [[{ color: 0, capacity: 4 }]], dockCount: 5,
};

it('finishes the same puzzle with the same deliveries at 60, 144, and 165 Hz', () => {
  const outcomes = [60, 144, 165].map(hz => {
    const game = new GameModel(level);
    const deliveries: number[] = [];
    game.events.on(event => { if (event.type === 'delivered') deliveries.push(event.cell); });
    game.placeCrate(0);
    for (let frame = 0; frame < hz * 30 && game.state === 'Playing'; frame++) game.update(1000 / hz);
    expect(game.state).toBe('Won');
    expect(game.board.remaining).toBe(0);
    return deliveries;
  });
  expect(outcomes[1]).toEqual(outcomes[0]);
  expect(outcomes[2]).toEqual(outcomes[0]);
});
