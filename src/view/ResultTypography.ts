import type { Text } from 'pixi.js';

export function resultTypography(label: Text, role: 'heading' | 'body' | 'button') {
  label.style.fontFamily = role === 'heading'
    ? 'Trebuchet MS, Arial Rounded MT Bold, sans-serif'
    : 'Segoe UI, Arial, sans-serif';
  label.style.fontWeight = role === 'body' ? '600' : '900';
  label.style.align = 'center';
  label.style.letterSpacing = role === 'heading' ? 0.5 : role === 'button' ? 1 : 0;
  return label;
}
