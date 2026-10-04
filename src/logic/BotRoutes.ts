import { Config } from '../core/Config';
import { cubeAccessRoute, type RoutePoint } from './RobotRoute';
import type { LevelData } from './LevelData';
import { dockPosition } from '../core/DockLayout';

export function botRoutes(level: LevelData, cells: readonly number[], cell: number, dockIndex: number, bonusSide?: 'left' | 'right') {
  const size = Math.min(Config.layout.boardSize / level.width, Config.layout.boardHeight / level.height);
  const project = (point: RoutePoint) => {
    const x = (Config.layout.boardSize - level.width * size) / 2 + (point.x + 0.5) * size;
    const y = (Config.layout.boardHeight - level.height * size) / 2 + (point.y + 0.5) * size;
    const center = Config.layout.boardHeight / 2;
    return { x: Config.layout.boardX + x + (center - y) * Config.projection.shearX,
      y: Config.layout.boardY + center + (y - center) * Config.projection.scaleY };
  };
  const access = cubeAccessRoute(cells, level.width, level.height, cell).map(project);
  const target = project({ x: cell % level.width, y: Math.floor(cell / level.width) });
  const dock = dockPosition(level.dockCount, dockIndex, bonusSide);
  const exit = { x: dock.x, y: dock.y - Config.layout.dockExitDistance };
  const bin = { x: Config.layout.binX, y: Config.layout.binY };
  const entry = access[0];
  return {
    outbound: entry ? [dock, exit, { x: entry.x, y: exit.y }, ...access] : [dock, exit, target],
    inbound: entry ? [...access].reverse().concat([{ x: entry.x, y: bin.y }, bin]) : [target, bin],
  };
}
