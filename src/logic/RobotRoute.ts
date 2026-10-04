export interface RoutePoint { x: number; y: number }

// Lowest blocks use bottom access. Upper targets enter from the perimeter,
// keeping the long ascent and descent outside the artwork.
export function cubeAccessRoute(cells: readonly number[], width: number, height: number, target: number, allowBottomEntry = false): RoutePoint[] {
  const start = { x: target % width, y: Math.floor(target / width) };
  const lowestRow = cells.reduce((lowest, color, index) => color >= 0 ? Math.max(lowest, Math.floor(index / width)) : lowest, -1);
  const upperTarget = start.y < lowestRow;
  const key = (point: RoutePoint) => `${point.x},${point.y}`;
  const queue = [start];
  const parents = new Map<string, RoutePoint | null>([[key(start), null]]);
  for (let head = 0; head < queue.length; head++) {
    const point = queue[head];
    if (upperTarget ? point.x === -1 || point.x === width || point.y === -1 || (allowBottomEntry && point.y === height) : point.y === height) {
      const path: RoutePoint[] = [];
      let current: RoutePoint | null = point;
      while (current) { path.push(current); current = parents.get(key(current))!; }
      if (!upperTarget) return path;
      const sideX = point.x === -1 || point.x === width ? point.x : start.x < width / 2 ? -1 : width;
      const perimeter: RoutePoint[] = [];
      for (let y = height; y >= point.y; y--) perimeter.push({ x: sideX, y });
      // A top-facing target is reached along the top edge after ascending a side.
      const step = point.x > sideX ? 1 : -1;
      for (let x = sideX + step; step > 0 ? x <= point.x : x >= point.x; x += step) {
        perimeter.push({ x, y: point.y });
      }
      return perimeter.concat(path.slice(1));
    }
    const directions = upperTarget ? [[-1, 0], [1, 0], [0, -1], [0, 1]] : [[0, 1], [-1, 0], [1, 0], [0, -1]];
    for (const [dx, dy] of directions) {
      const next = { x: point.x + dx, y: point.y + dy };
      if (next.x < -1 || next.x > width || next.y < -1 || next.y > height || parents.has(key(next))) continue;
      if (upperTarget && !allowBottomEntry && next.y === height) continue;
      if (next.x >= 0 && next.x < width && next.y >= 0 && next.y < height && cells[next.y * width + next.x] >= 0) continue;
      parents.set(key(next), point);
      queue.push(next);
    }
  }
  // Some exposed pockets connect only to the bottom. Preserve their legal access
  // rather than trapping an otherwise solvable level; this is a collection approach.
  return upperTarget && !allowBottomEntry ? cubeAccessRoute(cells, width, height, target, true) : [];
}
