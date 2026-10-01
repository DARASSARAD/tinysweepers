import type { LevelData } from './LevelData';

const files = import.meta.glob<LevelData>('../../levels/level_*.json', { eager: true, import: 'default' });
export const levels = Object.values(files).sort((a, b) => a.id - b.id);
export const levelNames = levels.map(level => level.title ?? `Room ${level.id}`);
