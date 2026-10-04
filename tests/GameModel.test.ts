import { describe, expect, it } from 'vitest';
import { Config } from '../src/core/Config';
import { BoardModel } from '../src/logic/BoardModel';
import { DockModel } from '../src/logic/DockModel';
import { GameModel } from '../src/logic/GameModel';
import { validate, type LevelData } from '../src/logic/LevelData';

const level: LevelData = {
  id: 1, width: 3, height: 3, palette: ['#64b5a4', '#efac60'],
  pixels: [0, 0, 0, 0, 1, 0, 0, 0, 0],
  lanes: [[{ color: 0, capacity: 8 }], [{ color: 1, capacity: 1 }]], dockCount: 2,
};

describe('level validation', () => {
  it('rejects capacity mismatches and invalid colors', () => {
    expect(() => validate(level)).not.toThrow();
    expect(() => validate({ ...level, lanes: [[{ color: 0, capacity: 9 }]] })).toThrow();
    expect(() => validate({ ...level, pixels: [...level.pixels.slice(1), 3] })).toThrow();
  });
});

describe('board reservations and exposure', () => {
  it('claims matching exposed cubes from the bottom row upward, left-to-right', () => {
    const board = new BoardModel(level);
    const claims = Array.from({ length: 8 }, (_, bot) => board.tryClaim(0, bot));
    expect(claims).toEqual([6, 7, 8, 3, 5, 0, 1, 2]);
  });
  it('prioritizes newly exposed lower cubes over older upper targets', () => {
    const board = new BoardModel({ ...level, pixels: Array(9).fill(0) });
    const bottom = [board.tryClaim(0, 1), board.tryClaim(0, 2), board.tryClaim(0, 3)];
    expect(bottom).toEqual([6, 7, 8]);
    board.remove(7, 2); // Center is appended to the exposed set after upper cubes.
    expect(board.tryClaim(0, 4)).toBe(3);
    expect(board.tryClaim(0, 5)).toBe(4);
    expect(board.tryClaim(0, 6)).toBe(5);
  });
  it('never reserves a cube twice or gives a bot two cubes', () => {
    const board = new BoardModel(level);
    const first = board.tryClaim(0, 1);
    expect(first).not.toBeNull();
    expect(board.tryClaim(0, 1)).toBeNull();
    expect(board.tryClaim(0, 2)).not.toBe(first);
    expect(board.remove(first!, 2)).toBe(false);
  });
  it('exposes the interior only after an adjacent cube is delivered', () => {
    const board = new BoardModel(level);
    expect(board.tryClaim(1, 9)).toBeNull();
    const corner = board.tryClaim(0, 1)!;
    board.remove(corner, 1);
    expect(board.isExposed(4)).toBe(false);
    const edge = board.tryClaim(0, 2)!;
    board.remove(edge, 2);
    expect(board.exposed.has(4)).toBe(true);
    expect(board.tryClaim(1, 9)).toBe(4);
  });
  it('supports empty neighbors and disabled exposure rules', () => {
    expect(new BoardModel({ ...level, pixels: [-1, -1, -1, -1, 1, -1, -1, -1, -1] }).isExposed(4)).toBe(true);
    expect(new BoardModel(level, false).tryClaim(1, 1)).toBe(4);
  });
});

describe('crate lanes and docks', () => {
  it('allows only the top crate and frees only completed docks', () => {
    const docks = new DockModel([[{ color: 0, capacity: 2 }, { color: 1, capacity: 1 }]], 1);
    expect(docks.place(0, 1)).toBeNull();
    expect(docks.place(0)).toBe(0);
    expect(docks.peek(0)?.color).toBe(1);
    expect(docks.place(0)).toBeNull();
    expect(docks.free(0)).toBe(false);
    docks.docks[0]!.atDock = 0;
    expect(docks.free(0)).toBe(true);
    expect(docks.place(0)).toBe(0);
  });
});

describe('game state and bot cycle', () => {
  it('reuses a dock after departure while its previous robots finish delivery', () => {
    const game = new GameModel({ ...level, dockCount: 1 });
    game.placeCrate(0);
    game.update(Config.motion.staggerMs * 7 + 1);
    expect(game.dockModel.docks[0]).toBeNull();
    expect(game.bots.size).toBeGreaterThan(0);
    expect(game.placeCrate(1)).toBe(true);
    for (let i = 0; i < 600; i++) game.update(50);
    expect(game.state).toBe('Won');
    expect(game.bots.size).toBe(0);
  });
  it('emits collection at pickup completion before dustbin delivery', () => {
    const game = new GameModel(level);
    const events: string[] = [];
    game.events.on(event => events.push(event.type));
    game.placeCrate(0);
    game.update([...game.bots.values()][0].travelMs.outbound + Config.motion.pickupMs - 1);
    expect(events).not.toContain('collected');
    game.update(1);
    expect(events.filter(type => type === 'collected')).toHaveLength(1);
    expect(events).not.toContain('delivered');
  });
  it('counts down at departure, including staggered departures', () => {
    const game = new GameModel(level);
    game.placeCrate(0);
    const crate = game.dockModel.docks[0]!;
    expect(crate.atDock).toBe(8);
    game.update(1);
    expect(crate.atDock).toBe(7);
    expect(crate.undelivered).toBe(8);
    game.update(Config.motion.staggerMs);
    expect(crate.atDock).toBe(6);
    game.update(Config.motion.staggerMs * 6);
    expect(crate.atDock).toBe(0);
    expect(crate.undelivered).toBe([...game.bots.values()].filter(bot => bot.crateId === crate.id).length);
  });
  it('removes a robot exactly when it arrives at the dustbin', () => {
    const game = new GameModel(level);
    game.placeCrate(0);
    const id = [...game.bots.keys()][0];
    const bot = game.bots.get(id)!;
    game.update(bot.travelMs.outbound + Config.motion.pickupMs + bot.travelMs.inbound - 1);
    expect(game.bots.get(id)?.phase).toBe('inbound');
    const remaining = game.board.remaining;
    game.update(1);
    expect(game.bots.has(id)).toBe(false);
    expect(game.board.remaining).toBe(remaining - 1);
    expect(game.dockModel.docks[0]).toBeNull();
  });
  it('wakes a waiting crate after delivery, clears cubes, frees docks, and wins', () => {
    const game = new GameModel(level);
    game.placeCrate(1); // Inner color must wait.
    expect(game.bots.size).toBe(0);
    game.placeCrate(0);
    expect(game.state).toBe('Playing');
    expect(game.board.remaining).toBe(9);
    for (let i = 0; i < 600; i++) game.update(50);
    expect(game.board.remaining).toBe(0);
    expect(game.state).toBe('Won');
    expect(game.dockModel.docks.every(crate => crate === null)).toBe(true);
    expect(game.bots.size).toBe(0);
    expect(game.placeCrate(0)).toBe(false);
  });
  it('loses when every dock is occupied by a blocked color', () => {
    const stuck = new GameModel({ ...level, dockCount: 1 });
    stuck.placeCrate(1);
    expect(stuck.state).toBe('Lost');
  });
  it('uses a powerup to move a buried crate directly to a dock', () => {
    const game = new GameModel({ ...level, lanes: [[
      { color: 0, capacity: 4 }, { color: 0, capacity: 4, hidden: true },
    ], [{ color: 1, capacity: 1 }]] });
    const buried = game.dockModel.lanes[0][1];
    expect(game.placeBuriedCrate(0, 1)).toBe(true);
    expect(game.dockModel.docks[0]?.color).toBe(buried.color);
    expect(game.dockModel.docks[0]?.hidden).toBe(false);
    expect(game.dockModel.lanes[0][0].hidden).toBe(false);
    expect(game.dockModel.lanes[0]).not.toContain(buried);
  });
  it('does not lose while a bot is moving or a dock is free', () => {
    const game = new GameModel({ ...level, dockCount: 1 });
    game.placeCrate(0);
    expect(game.state).toBe('Playing');
    for (let i = 0; i < 600; i++) game.update(50);
    expect(game.dockModel.docks[0]).toBeNull();
    expect(game.state).toBe('Playing');
    game.placeCrate(1);
    for (let i = 0; i < 600; i++) game.update(50);
    expect(game.state).toBe('Won');
  });
  it('keeps a picked-up cube reserved until delivery', () => {
    const game = new GameModel(level);
    game.placeCrate(0);
    game.update([...game.bots.values()][0].travelMs.outbound + Config.motion.pickupMs + 20);
    expect([...game.bots.values()][0].phase).toBe('inbound');
    expect(game.board.remaining).toBe(9);
    expect(game.board.reservations.size).toBe(8);
  });
});
