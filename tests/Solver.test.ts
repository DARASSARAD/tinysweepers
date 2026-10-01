import { expect, it } from 'vitest';
import { solve } from '../src/logic/Solver';
import { generateLevel } from '../tools/level-generator/Generate';
import type { LevelData } from '../src/logic/LevelData';

const stuck: LevelData = { id: 1, width: 3, height: 3, palette: ['#ffffff', '#000000'],
  pixels: [0,0,0,0,1,0,0,0,0], lanes: [[{ color: 1, capacity: 1 }, { color: 0, capacity: 8 }]], dockCount: 1 };
it('detects a known unsolvable lane order', () => {
  expect(solve(stuck).status).toBe('unsolvable');
});
it('distinguishes a search limit from an unsolvable result', () => {
  expect(solve(stuck, 0).status).toBe('limit');
});
it('generates capacity-balanced solvable levels across varied mosaics', () => {
  for (let seed = 1; seed <= 12; seed++) {
    const pixels = Array.from({ length: 64 }, (_, i) => (i * 7 + Math.floor(i / 8) * seed) % 4);
    const generated = generateLevel(seed, 8, 8, ['#ffffff','#aabbcc','#112233','#ffbb00'], pixels, 'Fixture');
    expect(solve(generated).status).toBe('solvable');
  }
});
