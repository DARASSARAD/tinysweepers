import { Container, Graphics, Rectangle } from 'pixi.js';
import type { CrateData } from '../logic/LevelData';
import type { GameAtlas } from './Atlas';
import { text } from './Elements';

export class CrateView extends Container {
  readonly pairId?: string;
  constructor(crate: CrateData, palette: string[], _atlas: GameAtlas, onTap?: () => void, raised = false) {
    super();
    this.pairId = crate.pairId;
    const color = crate.hidden ? '#747780' : palette[crate.color];
    const shape = new Graphics()
      .roundRect(-54, -49, 108, 110, 18).fill({ color: '#654b34', alpha: 0.2 });
    if (raised) {
      shape.roundRect(-54, -34, 108, 108, 18).fill(color)
        .roundRect(-54, -34, 108, 108, 18).fill({ color: '#26372c', alpha: 0.24 });
    }
    shape.roundRect(-54, -54, 108, 108, 18).fill(color)
      .roundRect(-54, -54, 108, 108, 18).stroke({ color: '#ffffff', alpha: crate.hidden ? 0.55 : raised ? 0.35 : 0.95, width: raised || crate.hidden ? 2 : 5 })
      .roundRect(-49, -49, 98, 98, 14).fill({ color: '#ffffff', alpha: raised ? 0.06 : 0.14 });
    this.addChild(shape);
    if (crate.hidden) {
      // Small tilted question marks form the playful mystery pattern around the face.
      for (const [x, y, angle, size] of [
        [-37, -37, -0.5, 20], [-12, -43, 0.4, 17], [33, -37, 0.5, 20],
        [-43, -9, -0.35, 18], [42, -8, 0.35, 17],
        [-38, 31, -0.5, 22], [-8, 42, 0.2, 18], [29, 34, 0.45, 21],
      ]) {
        const mark = text(this, '?', x, y, size, '#ffffff');
        mark.rotation = angle;
        mark.alpha = 0.95;
      }
      this.addChild(new Graphics().circle(12, -40, 3).fill('#ffffff')
        .circle(-43, 14, 3).fill('#ffffff').circle(43, 18, 3).fill('#ffffff')
        .circle(12, 43, 3).fill('#ffffff'));
    }
    const count = text(this, crate.hidden ? '?' : `${crate.capacity}`, 0, -4, crate.hidden ? 52 : 42, '#ffffff');
    count.style.stroke = { color: '#24332d', width: 5, join: 'round' };
    if (onTap) {
      this.eventMode = 'static';
      this.cursor = 'pointer';
      this.hitArea = new Rectangle(-56, -56, 112, 122);
      this.on('pointertap', onTap);
    }
  }
}
