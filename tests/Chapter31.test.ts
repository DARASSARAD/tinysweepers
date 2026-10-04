import { expect, it } from 'vitest';
import { levels } from '../src/logic/Levels';
import { difficultyBands } from '../src/logic/Difficulty';

it.each([31, 32, 33, 34, 35, 36])('level %i includes mystery blocks and buried hidden crates', id => {
  const level = levels.find(item => item.id === id)!;
  expect(level).toBeDefined();
  expect(level.dockCount).toBe(5);
  const blocks = level.pixels.filter(color => color >= 0).length;
  expect(blocks).toBe([361, 900, 900, 1024, 1296, 780][id - 31]);
  expect(level.mysteryCells!.length).toBeGreaterThan(0);
  for (const cell of level.mysteryCells!) {
    expect(cell % level.width).toBeGreaterThan(0);
    expect(cell % level.width).toBeLessThan(level.width - 1);
    expect(Math.floor(cell / level.width)).toBeGreaterThan(0);
    expect(Math.floor(cell / level.width)).toBeLessThan(level.height - 1);
  }
  expect(level.lanes.every(lane => !lane[0].hidden)).toBe(true);
  expect(level.lanes.flat().filter(crate => crate.hidden)).toHaveLength(4 + (id - 31) * 2);
  expect(new Set(level.pixels.filter(color => color >= 0)).size).toBe(level.palette.length);
  expect(level.difficulty).toBe(id === 35 ? 'Medium' : 'Easy');
  const [min, max] = difficultyBands[level.difficulty!];
  expect(level.sampledWinRate).toBeGreaterThanOrEqual(min);
  expect(level.sampledWinRate).toBeLessThanOrEqual(max);
});
