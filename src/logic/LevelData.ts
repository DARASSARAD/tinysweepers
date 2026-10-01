export interface CrateData { color: number; capacity: number }

export interface LevelData {
  id: number;
  width: number;
  height: number;
  palette: string[];
  pixels: number[];
  lanes: CrateData[][];
  dockCount: number;
}

export function validate(level: LevelData): void {
  if (!Number.isInteger(level.id) || level.id < 1) throw new Error('Invalid level id');
  if (![level.width, level.height, level.dockCount].every(n => Number.isInteger(n) && n > 0)) {
    throw new Error('Dimensions and dock count must be positive integers');
  }
  if (!level.palette.length || !level.palette.every(color => /^#[\da-f]{6}$/i.test(color))) {
    throw new Error('Palette must contain hex colors');
  }
  if (level.pixels.length !== level.width * level.height) throw new Error('Pixel count does not match dimensions');
  const counts = level.palette.map(() => 0);
  const capacities = level.palette.map(() => 0);
  for (const color of level.pixels) {
    if (!Number.isInteger(color) || color < -1 || color >= counts.length) throw new Error('Invalid pixel color');
    if (color >= 0) counts[color]++;
  }
  if (!counts.some(n => n > 0)) throw new Error('Level must contain cubes');
  if (!level.lanes.length) throw new Error('Level must contain crate lanes');
  for (const crate of level.lanes.flat()) {
    if (!Number.isInteger(crate.color) || crate.color < 0 || crate.color >= counts.length) throw new Error('Invalid crate color');
    if (!Number.isInteger(crate.capacity) || crate.capacity <= 0) throw new Error('Invalid crate capacity');
    capacities[crate.color] += crate.capacity;
  }
  if (counts.some((count, color) => count !== capacities[color])) throw new Error('Crate capacities must equal cube counts for every color');
}
