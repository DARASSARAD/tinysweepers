import { Config } from './Config';

export function fitPlayArea(width: number, height: number) {
  const scale = Math.min(width / Config.designWidth, height / Config.designHeight);
  return {
    scale,
    x: (width - Config.designWidth * scale) / 2,
    y: (height - Config.designHeight * scale) / 2,
  };
}
