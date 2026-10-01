import type { LevelData } from './LevelData';

const files = import.meta.glob<LevelData>('../../levels/level_*.json', { eager: true, import: 'default' });
export const levels = Object.values(files).sort((a, b) => a.id - b.id);
const tutorialNames = ['First steps', 'A little sunshine', 'Choose your order'];
export const levelNames = levels.map(level => level.title ?? tutorialNames[level.id - 1] ?? `Room ${level.id}`);
