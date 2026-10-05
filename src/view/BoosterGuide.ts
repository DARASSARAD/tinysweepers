import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { text } from './Elements';
import { UITheme } from './UITheme';

export class BoosterGuide extends Container {
  private pulse = 0;
  private readonly hand: Text;
  private readonly ring: Graphics;
  constructor(private readonly targetX: number, title: string) {
    super();
    const x = targetX; const y = 1810; const radius = 80;
    const shade = new Graphics()
      .rect(0, 0, 1080, y - radius)
      .rect(0, y - radius, x - radius, radius * 2)
      .rect(x + radius, y - radius, 1080 - x - radius, radius * 2)
      .rect(0, y + radius, 1080, 1920 - y - radius)
      .fill({ color: '#34291d', alpha: 0.65 });
    shade.eventMode = 'static';
    // Block every other control, but let the real powerup receive the tap.
    shade.hitArea = { contains: (px: number, py: number) => new Rectangle(0, 0, 1080, 1920).contains(px, py)
      && !(px >= x - radius && px <= x + radius && py >= y - radius && py <= y + radius) };
    this.addChild(shade);
    const card = new Graphics().roundRect(140, 1450, 800, 160, 35).fill(UITheme.colors.cream)
      .roundRect(140, 1450, 800, 160, 35).stroke({ color: UITheme.colors.rim, width: 7 });
    card.eventMode = 'none'; this.addChild(card);
    const hint = text(this, `Tap ${title}\nto try your new booster!`, 540, 1530, 43, UITheme.colors.ink);
    hint.style.fontFamily = UITheme.font; hint.style.align = 'center'; hint.eventMode = 'none';
    this.ring = new Graphics(); this.ring.eventMode = 'none'; this.addChild(this.ring);
    this.hand = text(this, '👆', x + 46, y + 72, 90);
    this.hand.style.fontFamily = 'Segoe UI Emoji, Apple Color Emoji, sans-serif';
    this.hand.rotation = -0.35; this.hand.eventMode = 'none';
    this.update(0);
  }
  update(delta: number) {
    this.pulse += delta;
    this.ring.clear().circle(this.targetX, 1810, 72 + Math.sin(this.pulse / 200) * 4)
      .stroke({ color: '#ffcf35', width: 6 });
    this.hand.y = 1882 + Math.sin(this.pulse / 250) * 7;
  }
}
