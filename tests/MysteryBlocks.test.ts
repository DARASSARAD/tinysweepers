import { expect, it } from 'vitest';
import { BoardModel } from '../src/logic/BoardModel';
import { levels } from '../src/logic/Levels';

it('reveals only edge-touching mystery blocks after a successful pickup', () => {
  const board = new BoardModel({ id: 26, width: 3, height: 3, dockCount: 5,
    palette: ['#ffffff'], pixels: Array(9).fill(0), lanes: [], mysteryCells: [1, 4, 8] });
  expect(board.remove(0, 123)).toBe(false);
  expect(board.mysteryCells.has(1)).toBe(true);
  const cell = board.tryClaim(0, 1)!;
  expect(cell).toBe(6);
  expect(board.remove(cell, 1)).toBe(true);
  // The center touches the removed block only diagonally.
  expect(board.mysteryCells.has(4)).toBe(true);
  const next = board.tryClaim(0, 2)!;
  expect(next).toBe(7);
  expect(board.mysteryCells.has(4)).toBe(true);
  expect(board.remove(next, 2)).toBe(true);
  expect(board.mysteryCells.has(4)).toBe(false);
  expect(board.mysteryCells.has(8)).toBe(false);
  expect(board.mysteryCells.has(1)).toBe(true);
});

it('does not let robots select unrevealed mystery blocks', () => {
  const board = new BoardModel({ id: 26, width: 2, height: 1, dockCount: 5,
    palette: ['#ffffff', '#ff0000'], pixels: [0, 1], lanes: [], mysteryCells: [1] });
  expect(board.canClaim(1)).toBe(false);
  expect(board.tryClaim(1, 1)).toBeNull();
  expect(board.remove(board.tryClaim(0, 2)!, 2)).toBe(true);
  expect(board.canClaim(1)).toBe(true);
});

it('adds the iPad level with mystery blocks and five docks', () => {
  const level = levels.find(level => level.id === 26)!;
  expect(level.title).toBe('Mystery iPad');
  expect(level.mysteryCells!.length).toBeGreaterThan(0);
  expect(level.dockCount).toBe(5);
});
