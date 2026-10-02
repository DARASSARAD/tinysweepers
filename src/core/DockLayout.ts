import { Config } from './Config';

export function dockPosition(baseCount: number, index: number, bonusSide?: 'left' | 'right') {
  const column = bonusSide ? (bonusSide === 'left' ? 0 : baseCount - 1) : index;
  return { x: (Config.designWidth - (baseCount - 1) * Config.layout.dockSpacing) / 2
    + column * Config.layout.dockSpacing, y: Config.layout.dockY + (bonusSide ? 170 : 0) };
}
