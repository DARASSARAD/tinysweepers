import { describe, expect, it } from 'vitest';
import { DockModel } from '../src/logic/DockModel';
import { botRoutes } from '../src/logic/BotRoutes';
import { dockPosition } from '../src/core/DockLayout';

describe('bonus docks', () => {
  it('unlocks each side once and places crates into the extra slots', () => {
    const docks = new DockModel([[{ color: 0, capacity: 1 }, { color: 1, capacity: 1 }, { color: 2, capacity: 1 }]], 1);
    docks.place(0);
    expect(docks.full).toBe(true);
    expect(docks.unlockBonus('left')).toBe(true);
    expect(docks.unlockBonus('left')).toBe(false);
    expect(docks.place(0)).toBe(1);
    expect(docks.unlockBonus('right')).toBe(true);
    expect(docks.place(0)).toBe(2);
    expect(docks.docks).toHaveLength(3);
  });
  it('routes robots from the unlocked button position', () => {
    const level = { id: 4, width: 1, height: 1, dockCount: 5,
      palette: ['#ffffff'], pixels: [0], lanes: [[{ color: 0, capacity: 1 }]] };
    for (const side of ['left', 'right'] as const) {
      expect(botRoutes(level, level.pixels, 0, 5, side).outbound[0]).toEqual(dockPosition(5, 5, side));
    }
  });
  it('moves single crates into bonus docks so a connected pair fits in the main row', () => {
    const docks = new DockModel([[{ color: 0, capacity: 1 }], [{ color: 1, capacity: 1 }],
      [{ color: 2, capacity: 1, pairId: 'p' }], [{ color: 3, capacity: 1, pairId: 'p' }]], 2);
    docks.place(0);
    docks.place(1);
    docks.unlockBonus('left');
    docks.unlockBonus('right');
    expect(docks.place(2)).toBe(0);
    expect(docks.docks.slice(0, 2).map(crate => crate?.pairId)).toEqual(['p', 'p']);
    expect(docks.docks.slice(2).every(Boolean)).toBe(true);
  });
});
