import type { Text } from 'pixi.js';
import { UITheme } from './UITheme';

export function resultTypography(label: Text, role: 'heading' | 'body' | 'button') {
  label.style.fontFamily = UITheme.font;
  label.style.fontWeight = role === 'body' ? '600' : '900';
  label.style.align = 'center';
  label.style.letterSpacing = role === 'heading' ? 0.5 : role === 'button' ? 1 : 0;
  return label;
}
