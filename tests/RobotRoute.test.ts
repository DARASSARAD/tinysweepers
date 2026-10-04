import { describe, expect, it } from 'vitest';
import { cubeAccessRoute } from '../src/logic/RobotRoute';
import { BoardModel } from '../src/logic/BoardModel';
import { botRoutes } from '../src/logic/BotRoutes';

describe('cube access routes', () => {
  it('waits for an exterior route to an enclosed empty pocket', () => {
    const cells = Array(25).fill(0);
    cells[12] = -1;
    cells[7] = 1;
    const board = new BoardModel({ id: 1, width: 5, height: 5, pixels: cells,
      palette: ['#ffffff', '#ff0000'], lanes: [], dockCount: 5 });
    expect(board.isExposed(7)).toBe(true);
    expect(board.canClaim(1)).toBe(false);
    expect(board.tryClaim(1, 10)).toBeNull();
    let bot = 0;
    while (!board.canClaim(1)) {
      const cell = board.tryClaim(0, bot)!;
      expect(cubeAccessRoute(board.cells, 5, 5, cell).length).toBeGreaterThan(0);
      board.remove(cell, bot++);
    }
    const target = board.tryClaim(1, 10)!;
    expect(target).toBe(7);
    expect(cubeAccessRoute(board.cells, 5, 5, target).length).toBeGreaterThan(0);
  });
  it('approaches the lowest remaining row from directly below', () => {
    expect(cubeAccessRoute([0, 0, 0, -1, -1, -1, -1, -1, -1], 3, 3, 1))
      .toEqual([{ x: 1, y: 3 }, { x: 1, y: 2 }, { x: 1, y: 1 }, { x: 1, y: 0 }]);
  });
  it('uses a side ascent for upper targets even when an interior column is clear', () => {
    const route = cubeAccessRoute([0, 0, 0, 0, -1, 0, 0, -1, 0], 3, 3, 1);
    expect(route[0]).toEqual({ x: -1, y: 3 });
    expect(route).toContainEqual({ x: -1, y: -1 });
    expect(route).not.toContainEqual({ x: 1, y: 1 });
    expect(route).not.toContainEqual({ x: 1, y: 2 });
    expect(route.at(-1)).toEqual({ x: 1, y: 0 });
  });
  it('goes around the side rather than crossing occupied cubes', () => {
    const cells = Array(9).fill(0);
    const route = cubeAccessRoute(cells, 3, 3, 3);
    expect(route[0].y).toBe(3);
    expect(route).toContainEqual({ x: -1, y: 1 });
    expect(route.at(-1)).toEqual({ x: 0, y: 1 });
    for (let i = 0; i < route.length - 1; i++) {
      const point = route[i];
      if (point.x >= 0 && point.x < 3 && point.y >= 0 && point.y < 3) expect(cells[point.y * 3 + point.x]).toBeLessThan(0);
      const next = route[i + 1];
      expect(Math.abs(next.x - point.x) + Math.abs(next.y - point.y)).toBe(1);
    }
  });
  it('returns from an upper block through the same perimeter corridor', () => {
    const level = { id: 1, width: 3, height: 3, pixels: Array(9).fill(0),
      palette: ['#ffffff'], lanes: [], dockCount: 5 };
    const routes = botRoutes(level, level.pixels, 1, 0);
    const approach = routes.outbound.slice(3);
    expect(routes.inbound.slice(0, approach.length)).toEqual([...approach].reverse());
    const sideX = approach[0].x;
    expect(approach.slice(0, 5).every(point => point.x === sideX)).toBe(true);
  });
  it('preserves access to a pocket that opens only toward the bottom', () => {
    const cells = Array(25).fill(0);
    cells[17] = cells[22] = -1;
    const route = cubeAccessRoute(cells, 5, 5, 12);
    expect(route.length).toBeGreaterThan(0);
    expect(route[0].x === -1 || route[0].x === 5).toBe(true);
    expect(route.at(-1)).toEqual({ x: 2, y: 2 });
  });
});
