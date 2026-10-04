import { Container, Graphics, Rectangle, Text } from 'pixi.js';

export function text(parent: Container, content: string, x: number, y: number, size: number, fill = '#314c49') {
  const item = new Text({ text: content, style: { fontFamily: 'system-ui', fontSize: size, fontWeight: '600', fill } });
  item.anchor.set(0.5);
  item.position.set(x, y);
  parent.addChild(item);
  return item;
}

export function button(parent: Container, content: string, x: number, y: number, width: number, onTap: () => void, fill = '#176f68') {
  const item = new Container();
  item.position.set(x, y);
  item.addChild(new Graphics().roundRect(-width / 2, -60, width, 120, 30).fill(fill));
  const label = text(item, content, 0, 0, 32, '#fffaf0');
  item.eventMode = 'static';
  item.cursor = 'pointer';
  item.hitArea = new Rectangle(-width / 2, -80, width, 160);
  item.on('pointertap', onTap);
  parent.addChild(item);
  return { item, label };
}

