import { expect, it } from 'vitest';
import { levels } from '../src/logic/Levels';
import { difficultyBands, levelDifficulty } from '../src/logic/Difficulty';

it('only assigns super hard when explicitly designated', () => {
  expect(levelDifficulty(30)).toBe('Hard');
  expect(levelDifficulty(30, 'Super Hard')).toBe('Super Hard');
  expect(levelDifficulty(7, 'Super Hard')).toBe('Super Hard');
});

it('categorizes every fifth level as medium and every tenth as hard', () => {
  for (const level of levels) {
    expect(level.difficulty).toBe(level.id % 10 === 0 ? 'Hard' : level.id % 5 === 0 ? 'Medium' : 'Easy');
  }
});

it('keeps the requested difficulty targets', () => {
  expect(difficultyBands).toEqual({ Easy: [60, 80], Medium: [40, 60], Hard: [10, 20], 'Super Hard': [5, 10] });
});

it('keeps every Easy campaign level within the 60–80% sample target', () => {
  for (const level of levels.filter(item => item.difficulty === 'Easy' && item.id !== 1)) {
    expect(level.sampledWinRate, `Level ${level.id}`).toBeGreaterThanOrEqual(60);
    expect(level.sampledWinRate, `Level ${level.id}`).toBeLessThanOrEqual(80);
  }
});

it('keeps the first tutorial level at 100% sampled wins', () => {
  expect(levels.find(level => level.id === 1)?.sampledWinRate).toBe(100);
});
