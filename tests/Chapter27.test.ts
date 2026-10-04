import { expect, it } from 'vitest';
import { levels } from '../src/logic/Levels';

it.each([[27, 6], [28, 7], [29, 8], [30, 7]])('level %i uses exactly %i colors without mystery blocks', (id, count) => {
  const level = levels.find(item => item.id === id)!;
  expect(level.palette).toHaveLength(count);
  expect(new Set(level.pixels.filter(color => color >= 0)).size).toBe(count);
  expect(level.mysteryCells ?? []).toHaveLength(0);
  expect(level.dockCount).toBe(5);
  expect(level.difficulty).toBe(id === 30 ? 'Hard' : 'Easy');
});
