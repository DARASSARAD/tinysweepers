import { Container, Graphics, Rectangle, Text } from 'pixi.js';

export function text(parent: Container, content: string, x: number, y: number, size: number, fill = '#314c49') {
  const item = new Text({ text: content, style: { fontFamily: 'system-ui', fontSize: size, fontWeight: '600', fill } });
  item.anchor.set(0.5);
  item.position.set(x, y);
  parent.addChild(item);
  return item;
}

export function button(parent: Container, content: string, x: number, y: number, width: number, onTap: () => void, fill = '#314c49') {
  const item = new Container();
  item.position.set(x, y);
  item.addChild(new Graphics().roundRect(-width / 2, -60, width, 120, 30).fill(fill));
  const label = text(item, content, 0, 0, 32, '#fffaf0');
  item.eventMode = 'static';
  item.cursor = 'pointer';
  item.hitArea = new Rectangle(-width / 2, -60, width, 120);
  item.on('pointertap', onTap);
  parent.addChild(item);
  return { item, label };
}

export function colorMark(parent: Container, color: number, x: number, y: number, size: number, fill = '#314c49') {
  const mark = new Graphics();
  if (color % 4 === 0) mark.circle(0, 0, size / 2).stroke({ width: 4, color: fill });
  else if (color % 4 === 1) mark.poly([0, -size / 2, size / 2, size / 2, -size / 2, size / 2]).stroke({ width: 4, color: fill });
  else if (color % 4 === 2) mark.rect(-size / 2, -size / 2, size, size).stroke({ width: 4, color: fill });
  else mark.poly([0, -size / 2, size / 2, 0, 0, size / 2, -size / 2, 0]).stroke({ width: 4, color: fill });
  mark.position.set(x, y);
  parent.addChild(mark);
  return mark;
}
