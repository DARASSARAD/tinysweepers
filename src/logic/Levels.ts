import type { LevelData } from './LevelData';
import { levelDifficulty } from './Difficulty';

const files = import.meta.glob<LevelData>('../../levels/level_*.json', { eager: true, import: 'default' });
export const levels = Object.values(files).map(level => ({ ...level,
  difficulty: levelDifficulty(level.id, level.difficulty),
})).sort((a, b) => a.id - b.id);
export const levelNames = levels.map(level => level.title ?? `Room ${level.id}`);
