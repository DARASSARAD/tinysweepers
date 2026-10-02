import { writeFile } from 'node:fs/promises';
import { generateLevel } from './Generate';
import { verifySolution } from '../audit-levels';

const width = 32;
const height = 40;
type Paint = (x: number, y: number) => number;
const ellipse = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) =>
  ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

const designs: { id: number; title: string; palette: string[]; paint: Paint }[] = [
  { id: 11, title: 'Citrus Pop', palette: ['#df5506', '#ff9200', '#ffc928', '#fff9d8', '#ae6a27', '#f2c98b'],
    paint: (x, y) => {
      if (x >= 13 && x <= 18 && y >= 32 && y <= 39) return x === 13 || x === 18 || y === 39 ? 4 : 5;
      const body = x >= 5 && x <= 26 && y >= 5 && y <= 32 && (y >= 9 || ellipse(x, y, 15.5, 10, 11, 6));
      if (!body) return -1;
      if (x === 5 || x === 26 || y === 32 || (y < 9 && !ellipse(x, y, 15.5, 10, 10, 5))) return 0;
      if (x === 8 && y >= 8 && y <= 16) return 3;
      const dx = x - 19; const dy = y - 22;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= 8) {
        if (distance >= 6.5 || Math.abs(dx) < 0.7 || Math.abs(dy) < 0.7 || Math.abs(dx - dy) < 0.8) return 3;
        return 2;
      }
      return 1;
    } },
  { id: 12, title: 'Rocket Ride', palette: ['#122753', '#ff3926', '#fff9e7', '#0bd4f5', '#ffe126', '#ff8700'],
    paint: (x, y) => {
      if (y >= 30 && y <= 39 && Math.abs(x - 15.5) <= (40 - y) * 0.7) return Math.abs(x - 15.5) <= (38 - y) * 0.38 ? 4 : 5;
      const body = y >= 1 && y <= 30 && Math.abs(x - 15.5) <= Math.min(8, y * 0.7);
      const fin = y >= 21 && y <= 32 && Math.abs(x - 15.5) >= 7 && Math.abs(x - 15.5) <= 14 - Math.abs(y - 26) * 0.7;
      if (fin) return Math.abs(x - 15.5) > 12 || y === 32 ? 0 : 1;
      if (!body) return -1;
      if (Math.abs(x - 15.5) >= Math.min(7, y * 0.7 - 1) || y === 30) return 0;
      if (y < 11) return 1;
      if (ellipse(x, y, 15.5, 18, 5, 6)) return ellipse(x, y, 15.5, 18, 3.5, 4.5) ? 3 : 0;
      if (y >= 26 && Math.abs(x - 15.5) < 1.5) return 1;
      return 2;
    } },
  { id: 13, title: 'Rainbow Butterfly', palette: ['#142753', '#f52dc2', '#922be8', '#0bdcef', '#ffe426'],
    paint: (x, y) => {
      const mirror = Math.min(x, 31 - x);
      if (Math.abs(x - 15.5) <= 1.5 && y >= 12 && y <= 36) return 0;
      if (y >= 6 && y <= 12 && (x === y + 3 || x === 28 - y)) return 0;
      const upper = ellipse(mirror, y, 7, 14, 7, 11) && y <= 23;
      const lower = ellipse(mirror, y, 9, 29, 6, 8);
      if (!upper && !lower) return -1;
      const inside = upper ? ellipse(mirror, y, 7, 14, 5.8, 9.5) : ellipse(mirror, y, 9, 29, 4.8, 6.7);
      if (!inside) return 0;
      if (ellipse(mirror, y, upper ? 7 : 6, upper ? 16 : 28, 2.4, 3)) return 3;
      if (mirror >= 10 && y >= 15 && y <= 31) return 4;
      return (Math.floor(y / 4) + Math.floor(mirror / 3)) % 3 === 0 ? 2 : 1;
    } },
  { id: 14, title: 'Strawberry Treat', palette: ['#a51326', '#ff3039', '#ff6851', '#087c36', '#6ce316', '#fff6cb'],
    paint: (x, y) => {
      const berry = y >= 11 && y <= 39 && Math.abs(x - 15.5) <= (y <= 22 ? 13 : (40 - y) * 0.73);
      let color = -1;
      if (berry) {
        const edge = Math.abs(x - 15.5) > (y <= 22 ? 11.5 : (40 - y) * 0.73 - 1.4) || y === 39;
        color = edge ? 0 : (x < 15 ? 2 : 1);
        if (!edge && y >= 16 && y <= 34 && (y % 7 === 2 || y % 7 === 3) && (x + Math.floor(y / 7) * 3) % 8 === 0) color = 5;
      }
      const leaf = ellipse(x, y, 15.5, 10, 13, 3) || ellipse(x, y, 8, 8, 4, 5) || ellipse(x, y, 23, 8, 4, 5) || (x >= 14 && x <= 17 && y >= 1 && y <= 12);
      if (leaf) color = (x + y) % 5 < 2 ? 4 : 3;
      return color;
    } },
  { id: 15, title: 'Treasure Chest', palette: ['#592706', '#a34e12', '#e08820', '#ffcd0c', '#06d4ef', '#aa36eb'],
    paint: (x, y) => {
      const lid = x >= 2 && x <= 29 && y >= 4 && y <= 15 && (y >= 7 || x >= 4 && x <= 27);
      let color = -1;
      if (lid) color = y >= 12 || x <= 5 || x >= 26 ? 3 : (x + y) % 5 === 0 ? 2 : 1;
      if (x >= 4 && x <= 27 && y >= 16 && y <= 21) color = 0;
      if (x >= 1 && x <= 30 && y >= 23 && y <= 37) color = x <= 3 || x >= 28 || y <= 25 || y >= 35 ? 3 : (x + y) % 6 === 0 ? 2 : 1;
      if (ellipse(x, y, 10, 20, 4, 5)) color = 4;
      if (ellipse(x, y, 23, 20, 4, 5)) color = 5;
      if (x >= 13 && x <= 18 && y >= 24 && y <= 32) color = x >= 15 && x <= 16 && y >= 27 && y <= 30 ? 0 : 3;
      return color;
    } },
];

for (const design of designs) {
  const pixels = Array.from({ length: width * height }, (_, index) => design.paint(index % width, Math.floor(index / width)));
  const occupied = pixels.flatMap((color, index) => color < 0 ? [] : [index]);
  const left = Math.min(...occupied.map(index => index % width));
  const right = Math.max(...occupied.map(index => index % width));
  const top = Math.min(...occupied.map(index => Math.floor(index / width)));
  const bottom = Math.max(...occupied.map(index => Math.floor(index / width)));
  const croppedWidth = right - left + 1;
  const croppedHeight = bottom - top + 1;
  const cropped = Array.from({ length: croppedWidth * croppedHeight }, (_, index) => pixels[(Math.floor(index / croppedWidth) + top) * width + index % croppedWidth + left]);
  const level = generateLevel(design.id, croppedWidth, croppedHeight, design.palette, cropped, design.title, 16);
  level.blockGap = level.tileGap = 0.5;
  level.dockCount = 5;
  if (!verifySolution(level).won) throw new Error(`Level ${design.id} failed timing verification`);
  await writeFile(`levels/level_${String(design.id).padStart(3, '0')}.json`, JSON.stringify(level, null, 2) + '\n');
  console.log(`Level ${design.id}: ${design.title}, ${croppedWidth}x${croppedHeight}, ${occupied.length} cubes, verified win`);
}
