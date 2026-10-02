export function vibrantColor(hex: string): string {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  let red = (value >> 16) & 255;
  let green = (value >> 8) & 255;
  let blue = value & 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  if (max - min < 12 || min > 242) return hex;

  const lightness = (max + min) / 2;
  const center = lightness < 96 ? 112 : lightness > 205 ? 198 : lightness;
  const saturation = 1.38;
  red = center + (red - lightness) * saturation;
  green = center + (green - lightness) * saturation;
  blue = center + (blue - lightness) * saturation;
  const channel = (color: number) => Math.max(0, Math.min(255, Math.round(color))).toString(16).padStart(2, '0');
  return `#${channel(red)}${channel(green)}${channel(blue)}`;
}
