export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Super Hard';

// These bands describe a settled random-choice simulation, not human win rates.
export const difficultyBands: Record<Difficulty, readonly [number, number]> = {
  Easy: [60, 80],
  Medium: [40, 60],
  Hard: [10, 20],
  'Super Hard': [5, 10],
};

export function levelDifficulty(id: number, override?: Difficulty): Difficulty {
  if (override === 'Super Hard') return override;
  return id % 10 === 0 ? 'Hard' : id % 5 === 0 ? 'Medium' : 'Easy';
}
