import { describe, expect, it } from 'vitest';
import { DockModel } from '../src/logic/DockModel';
import { GameModel } from '../src/logic/GameModel';
import { levels } from '../src/logic/Levels';

const pair = (same = false) => [[{ color: 0, capacity: 1, pairId: 'pair' }],
  [{ color: same ? 0 : 1, capacity: 1, pairId: 'pair' }]];

describe('connected crates', () => {
  it.each([true, false])('places both crates atomically, same color: %s', same => {
    const docks = new DockModel(pair(same), 5);
    expect(docks.place(1)).toBe(0);
    expect(docks.lastPlaced).toEqual([{ lane: 0, dock: 0 }, { lane: 1, dock: 1 }]);
    expect(docks.lanes.flat()).toHaveLength(0);
    expect(docks.docks.filter(Boolean)).toHaveLength(2);
  });
  it('rejects a pair with only one free slot without changing anything', () => {
    const docks = new DockModel([...pair(), [{ color: 2, capacity: 1 }]], 2);
    docks.place(2);
    const before = JSON.stringify({ lanes: docks.lanes, docks: docks.docks });
    expect(docks.place(0)).toBeNull();
    expect(JSON.stringify({ lanes: docks.lanes, docks: docks.docks })).toBe(before);
  });
  it('shifts the middle crate when the first and third docks are free', () => {
    const docks = new DockModel([...pair(), [{ color: 2, capacity: 1 }]], 3);
    docks.place(2);
    const existing = docks.docks[0]!;
    docks.docks[0] = null;
    docks.docks[1] = existing;
    expect(docks.place(0)).toBe(0);
    expect(docks.docks[2]).toBe(existing);
    expect(docks.docks.slice(0, 2).map(crate => crate?.pairId)).toEqual(['pair', 'pair']);
  });
  it('waits until both halves reach the front', () => {
    const docks = new DockModel([pair()[0], [{ color: 2, capacity: 1 }, ...pair()[1]]], 5);
    expect(docks.place(0)).toBeNull();
    docks.place(1);
    expect(docks.place(0)).not.toBeNull();
  });
  it('loses when the remaining pair cannot fit and no bots can free space', () => {
    const game = new GameModel({ id: 14, width: 3, height: 3, dockCount: 2,
      palette: ['#ffffff', '#ff0000'], pixels: [0, 0, 0, 0, 1, 0, 0, 0, 0],
      lanes: [[{ color: 1, capacity: 1 }], [{ color: 0, capacity: 4, pairId: 'p' }],
        [{ color: 0, capacity: 4, pairId: 'p' }]] });
    game.placeCrate(0);
    expect(game.state).toBe('Lost');
  });
  it('introduces pairs only from level 14 onward', () => {
    for (const level of levels) {
      expect(level.lanes.flat().some(crate => crate.pairId)).toBe(level.id >= 14);
    }
  });
  it('includes connected pairs deeper in every later level queue', () => {
    for (const level of levels.filter(level => level.id >= 14)) {
      expect(level.lanes.some(lane => lane.some((crate, depth) => depth >= 3 && crate.pairId))).toBe(true);
    }
  });
  it('includes staggered pairs whose halves must advance independently', () => {
    const level = levels.find(level => level.id === 14)!;
    const depths = new Map<string, number[]>();
    level.lanes.forEach(lane => lane.forEach((crate, depth) => {
      if (!crate.pairId) return;
      depths.set(crate.pairId, [...(depths.get(crate.pairId) ?? []), depth]);
    }));
    expect([...depths.values()].some(([a, b]) => a !== b)).toBe(true);
  });
  it('updates staggered robot departures when an occupied dock shifts', () => {
    const game = new GameModel({ id: 14, width: 3, height: 1, dockCount: 3,
      palette: ['#ffffff', '#ff0000', '#00ff00'], pixels: [0, 1, 2],
      lanes: [[{ color: 0, capacity: 1 }], [{ color: 1, capacity: 1, pairId: 'p' }],
        [{ color: 2, capacity: 1, pairId: 'p' }]] });
    game.placeCrate(0);
    const first = [...game.bots.values()][0];
    const existing = game.dockModel.docks[0]!;
    game.dockModel.docks[0] = null;
    game.dockModel.docks[1] = existing;
    first.dock = 1;
    expect(game.placeCrate(1)).toBe(true);
    expect(first.dock).toBe(2);
    expect(() => game.update(1)).not.toThrow();
    for (let tick = 0; tick < 1000 && game.state === 'Playing'; tick++) game.update(50);
    expect(game.state).toBe('Won');
  });
});
