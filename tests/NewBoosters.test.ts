import { expect, it } from 'vitest';
import { GameModel } from '../src/logic/GameModel';
import type { LevelData } from '../src/logic/LevelData';

const level: LevelData = {
  id: 8, width: 3, height: 3, palette: ['#64b5a4', '#efac60'],
  pixels: [0, 0, 0, 0, 1, 0, 0, 0, 0],
  lanes: [[{ color: 1, capacity: 1 }, { color: 0, capacity: 8 }]], dockCount: 2,
};

it('shuffle brings an exposed-color shipment to the front without changing totals', () => {
  const game = new GameModel(level);
  const before = game.dockModel.lanes.flat().map(crate => `${crate.color}:${crate.capacity}`).sort();
  expect(game.shuffleCrates(() => 0)).toBe(true);
  expect(game.dockModel.peek(0)?.color).toBe(0);
  expect(game.dockModel.canPlace(0)).toBe(true);
  expect(game.dockModel.lanes.flat().map(crate => `${crate.color}:${crate.capacity}`).sort()).toEqual(before);
});

it('shuffle preserves connected pairs and fronts both partners', () => {
  const game = new GameModel({ ...level, lanes: [
    [{ color: 1, capacity: 1 }, { color: 0, capacity: 4, pairId: 'a' }],
    [{ color: 0, capacity: 4, pairId: 'a' }],
  ] });
  expect(game.shuffleCrates(() => 0)).toBe(true);
  expect(game.dockModel.placementLanes(0)).toEqual([0, 1]);
});

it('vacuum clears the selected whole color, cancels its bots and allows the rest to win', () => {
  const game = new GameModel({ ...level, lanes: [[{ color: 0, capacity: 8 }], [{ color: 1, capacity: 1 }]] });
  game.placeCrate(0);
  game.update(100);
  expect(game.bots.size).toBeGreaterThan(0);
  expect(game.vacuumColor(0)).toBe(true);
  expect(game.board.remaining).toBe(1);
  expect(game.bots.size).toBe(0);
  expect(game.board.reservations.size).toBe(0);
  expect(game.dockModel.docks.every(crate => !crate)).toBe(true);
  expect(game.placeCrate(1)).toBe(true);
  for (let i = 0; i < 100; i++) game.update(500);
  expect(game.state).toBe('Won');
});

it('vacuum removes buried matching crates and detaches surviving partners', () => {
  const game = new GameModel({ ...level, lanes: [
    [{ color: 1, capacity: 1, pairId: 'a' }],
    [{ color: 0, capacity: 8, pairId: 'a' }],
  ] });
  expect(game.vacuumColor(4)).toBe(true);
  expect(game.dockModel.lanes[0]).toEqual([]);
  expect(game.dockModel.peek(1)?.pairId).toBeUndefined();
  expect(game.dockModel.canPlace(1)).toBe(true);
  expect(game.vacuumColor(4)).toBe(false);
  expect(game.vacuumColor(-1)).toBe(false);
});
