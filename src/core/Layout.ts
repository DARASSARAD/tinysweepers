import { Config } from './Config';

export interface SafeAreaInsets { top: number; right: number; bottom: number; left: number }

export function fitPlayArea(width: number, height: number,
  insets: SafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 }) {
  const scale = Math.min((width - insets.left - insets.right) / Config.designWidth,
    (height - insets.top - insets.bottom) / Config.designHeight);
  return {
    scale,
    x: insets.left + (width - insets.left - insets.right - Config.designWidth * scale) / 2,
    y: insets.top + (height - insets.top - insets.bottom - Config.designHeight * scale) / 2,
  };
}
