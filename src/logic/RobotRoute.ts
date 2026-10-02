export interface RoutePoint { x: number; y: number }

// Search from the exposed target to the bottom aisle, preferring downward access.
export function cubeAccessRoute(cells: readonly number[], width: number, height: number, target: number): RoutePoint[] {
  const start = { x: target % width, y: Math.floor(target / width) };
  const key = (point: RoutePoint) => `${point.x},${point.y}`;
  const queue = [start];
  const parents = new Map<string, RoutePoint | null>([[key(start), null]]);
  for (let head = 0; head < queue.length; head++) {
    const point = queue[head];
    if (point.y === height) {
      const path: RoutePoint[] = [];
      let current: RoutePoint | null = point;
      while (current) { path.push(current); current = parents.get(key(current))!; }
      return path;
    }
    for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) {
      const next = { x: point.x + dx, y: point.y + dy };
      if (next.x < -1 || next.x > width || next.y < -1 || next.y > height || parents.has(key(next))) continue;
      if (next.x >= 0 && next.x < width && next.y >= 0 && next.y < height && cells[next.y * width + next.x] >= 0) continue;
      parents.set(key(next), point);
      queue.push(next);
    }
  }
  return [];
}
