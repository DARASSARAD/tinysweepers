import { Container, Graphics } from 'pixi.js';
import { button, text } from './Elements';
import { UITheme } from './UITheme';

export class SpeedButton extends Container {
  private readonly face: Graphics;
  private readonly timer;
  constructor(onTap: () => void) {
    super();
    this.position.set(825, 95);
    this.scale.set(0.65);
    const control = button(this, '', 0, 0, 230, onTap);
    control.item.label = 'Toggle 2x game speed';
    this.face = control.item.children[0] as Graphics;
    const arrows = new Graphics().poly([-82, -28, -82, 28, -46, 0]).fill(UITheme.colors.cream)
      .poly([-53, -28, -53, 28, -17, 0]).fill(UITheme.colors.cream);
    arrows.eventMode = 'none'; control.item.addChild(arrows);
    const label = text(control.item, '2x', 48, 0, 56, '#ffffff');
    label.style.fontFamily = UITheme.font; label.style.fontWeight = '900';
    label.style.stroke = { color: '#315410', width: 4 }; label.eventMode = 'none';
    this.addChild(new Graphics().roundRect(-115, 85, 230, 65, 15).fill({ color: '#b58551', alpha: 0.65 }));
    this.timer = text(this, '', 0, 117, 34, '#ffffff');
    this.timer.style.fontFamily = UITheme.font; this.timer.style.fontWeight = '900';
    this.refresh(false, 300_000);
  }
  refresh(active: boolean, remainingMs: number) {
    this.face.clear().roundRect(-123, -61, 246, 131, 35).fill(UITheme.colors.cream)
      .roundRect(-115, -51, 230, 120, 28).fill('#426f13')
      .roundRect(-115, -58, 230, 120, 28).fill(active ? '#a4ed27' : '#72bc20')
      .roundRect(-99, -48, 198, 18, 9).fill({ color: '#ffffff', alpha: 0.4 });
    const seconds = Math.ceil(remainingMs / 1000);
    this.timer.text = `${Math.floor(seconds / 60)}m:${String(seconds % 60).padStart(2, '0')}s`;
  }
}
