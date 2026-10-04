import { Config } from './Config';

export function dockPosition(baseCount: number, index: number, bonusSide?: 'left' | 'right') {
  if (bonusSide) {
    // Keep bonus docks outside the four queue lanes when the main dock row is compact.
    const edge = (Config.designWidth - (Config.levels.laneCount + 1) * Config.layout.laneSpacing) / 2 - 24;
    return { x: bonusSide === 'left' ? edge : Config.designWidth - edge, y: Config.layout.dockY + 170 };
  }
  return { x: (Config.designWidth - (baseCount - 1) * Config.layout.dockSpacing) / 2
    + index * Config.layout.dockSpacing, y: Config.layout.dockY };
}
