import { Container, Graphics, Rectangle, Sprite } from 'pixi.js';
import type { CrateData } from '../logic/LevelData';
import type { GameAtlas } from './Atlas';
import { colorMark, text } from './Elements';

export class CrateView extends Container {
  constructor(crate: CrateData, palette: string[], atlas: GameAtlas, symbols: boolean, onTap?: () => void) {
    super();
    const sprite = new Sprite(atlas.crate);
    sprite.anchor.set(0.5);
    sprite.tint = palette[crate.color];
    this.addChild(sprite);
    text(this, `${crate.capacity}`, 0, 15, 48);
    if (symbols) colorMark(this, crate.color, 0, -33, 22);
    else this.addChild(new Graphics().roundRect(-21, -41, 42, 18, 7).fill({ color: '#fffaf0', alpha: 0.65 }));
    if (onTap) {
      this.eventMode = 'static';
      this.cursor = 'pointer';
      this.hitArea = new Rectangle(-84, -76, 168, 150);
      this.on('pointertap', onTap);
    }
  }
}
