import { Container, Graphics } from 'pixi.js';
import { CrateView } from './CrateView';

export function drawConnections(group: Container) {
  let links = group.children.find(child => child.label === 'crate-links') as Graphics | undefined;
  if (!links) {
    links = new Graphics();
    links.label = 'crate-links';
    group.addChildAt(links, 0);
  }
  links.clear();
  const pairs = new Map<string, { x: number; y: number }[]>();
  const visit = (node: Container, x: number, y: number) => {
    for (const child of node.children) {
      if (child instanceof CrateView && child.pairId) {
        const points = pairs.get(child.pairId) ?? [];
        points.push({ x: x + child.x, y: y + child.y });
        pairs.set(child.pairId, points);
      } else if (child instanceof Container) visit(child, x + child.x, y + child.y);
    }
  };
  visit(group, 0, 0);
  for (const points of pairs.values()) {
    if (points.length !== 2) continue;
    const [a, b] = points;
    links.moveTo(a.x, a.y + 6).lineTo(b.x, b.y + 6).stroke({ color: '#514b59', width: 18 })
      .moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ color: '#dbd5e1', width: 14 })
      .moveTo(a.x, a.y - 3).lineTo(b.x, b.y - 3).stroke({ color: '#ffffff', alpha: 0.6, width: 3 });
  }
}
