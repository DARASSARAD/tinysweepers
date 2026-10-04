import { expect, it } from 'vitest';
import { levels } from '../src/logic/Levels';

it('ramps board size, crate count, mystery choices and connected pairs from 20 to 25', () => {
  const chapter = levels.filter(level => level.id >= 20 && level.id <= 25);
  expect(chapter).toHaveLength(6);
  chapter.forEach((level, index) => {
    const referenceColors = [8, 3, 5, 6, 6, 6];
    expect(level.palette).toHaveLength(referenceColors[index]);
    expect(new Set(level.pixels.filter(color => color >= 0)).size).toBe(referenceColors[index]);
    expect(level.lanes.flat().filter(crate => crate.hidden)).toHaveLength(index * 4);
    expect(new Set(level.lanes.flat().map(crate => crate.pairId).filter(Boolean)).size).toBe(index + 1);
    expect(level.lanes.every(lane => !lane[0].hidden)).toBe(true);
    if (index > 0) {
      expect(level.pixels.length).toBeGreaterThan(chapter[index - 1].pixels.length);
      expect(level.lanes.flat().length).toBeGreaterThan(chapter[index - 1].lanes.flat().length);
    }
  });
});
