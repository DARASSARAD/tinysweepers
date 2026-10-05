import { Graphics } from 'pixi.js';

export function coinIcon(x: number, y: number, radius: number) {
  const star = Array.from({ length: 10 }, (_, index) => {
    const angle = -Math.PI / 2 + index * Math.PI / 5;
    const size = radius * (index % 2 === 0 ? 0.6 : 0.3);
    return [x + Math.cos(angle) * size, y + Math.sin(angle) * size];
  }).flat();
  return new Graphics().circle(x, y + radius * 0.13, radius * 1.07).fill('#bb7d12')
    .circle(x, y, radius).fill('#ffcb35')
    .circle(x, y, radius * 0.78).stroke({ color: '#fff39b', width: radius * 0.11 })
    .poly(star).fill('#fff3a0');
}
