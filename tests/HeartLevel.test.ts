import { expect, it } from 'vitest';
import { levels } from '../src/logic/Levels';

it('keeps the reference heart silhouette symmetric with two separate yellow stars', () => {
  const heart = levels.find(level => level.id === 31)!;
  expect(heart).toBeDefined();
  expect(heart.width).toBe(19);
  expect(heart.height).toBe(19);
  expect(heart.palette).toHaveLength(3);
  for (let y = 0; y < heart.height; y++) {
    for (let x = 0; x < heart.width; x++) {
      expect(heart.pixels[y * heart.width + x]).toBe(heart.pixels[y * heart.width + heart.width - 1 - x]);
    }
  }
  expect(heart.pixels[18 * 19 + 9]).toBe(0); // Pink bottom tip.
  expect(heart.pixels[0]).toBe(-1); // Empty corner, no background cubes.
  expect(heart.pixels[9 * 19 + 7]).toBe(2);
  expect(heart.pixels[9 * 19 + 11]).toBe(2);
  expect(heart.pixels[9 * 19 + 9]).toBe(1); // Cyan gap between the two stars.
});
