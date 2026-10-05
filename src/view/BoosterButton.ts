import { Container, Graphics, Rectangle } from 'pixi.js';
import { text } from './Elements';
import { UITheme } from './UITheme';

export class BoosterButton extends Container {
  constructor(readonly kind: 'cratePicker' | 'shuffle' | 'bigVacuum', x: number, onTap: () => void) {
    super();
    this.position.set(x, 1810);
    this.hitArea = new Rectangle(-76, -76, 152, 152);
    this.on('pointertap', onTap);
    this.label = kind === 'cratePicker' ? 'Choose Any Crate' : kind === 'shuffle' ? 'Shuffle crates' : 'Big Vacuum';
  }
  refresh(level: number, unlock: number, count: number) {
    for (const child of this.removeChildren()) child.destroy({ children: true });
    const unlocked = level >= unlock;
    this.eventMode = unlocked ? 'static' : 'none';
    this.cursor = unlocked ? 'pointer' : 'default';
    const icon = new Graphics().circle(0, 6, 64).fill({ color: '#79604b', alpha: 0.2 })
      .circle(0, 0, 64).fill(UITheme.colors.rim).stroke({ color: UITheme.colors.blue, width: 9 });
    if (!unlocked) {
      icon.arc(0, -27, 16, Math.PI, Math.PI * 2).stroke({ color: '#ba7812', width: 7 })
        .roundRect(-25, -28, 50, 42, 12).fill('#ffc62d').stroke({ color: '#ba7812', width: 3 })
        .circle(0, -9, 5).fill('#965d09').rect(-3, -8, 6, 11).fill('#965d09');
    } else if (this.kind === 'cratePicker') {
      icon.roundRect(-32, -32, 42, 60, 8).fill('#d2d5db').stroke({ color: '#777a86', width: 3 })
        .roundRect(-15, -40, 42, 60, 8).fill('#ffffff').stroke({ color: '#777a86', width: 3 })
        .poly([-3, -15, 13, -15, 13, -1, 27, -1, 27, 15, 13, 15, 13, 29,
          -3, 29, -3, 15, -17, 15, -17, -1, -3, -1]).fill('#59ce35')
        .stroke({ color: '#2c8d2e', width: 3, join: 'round' });
    } else if (this.kind === 'shuffle') {
      icon.moveTo(-33, -25).lineTo(-16, -25).lineTo(18, 17).lineTo(34, 17)
        .moveTo(-33, 17).lineTo(-16, 17).lineTo(18, -25).lineTo(34, -25)
        .stroke({ color: UITheme.colors.pink, width: 11, cap: 'round', join: 'round' })
        .poly([23, -38, 42, -25, 23, -12]).fill(UITheme.colors.pink)
        .poly([23, 4, 42, 17, 23, 30]).fill(UITheme.colors.pink);
    } else {
      icon.roundRect(-18, -30, 36, 56, 10).fill(UITheme.colors.blue)
        .roundRect(-23, -37, 46, 18, 7).fill(UITheme.colors.pink)
        .moveTo(-17, -12).bezierCurveTo(-48, -15, -45, 22, -35, 27)
        .moveTo(17, -12).bezierCurveTo(48, -15, 45, 22, 35, 27)
        .stroke({ color: '#22bcc5', width: 12, cap: 'round' });
    }
    this.addChild(icon);
    const label = text(this, unlocked ? count > 0 ? String(count) : '+' : `Lv. ${unlock}`, unlocked ? 43 : 0, 41, 29, UITheme.colors.ink);
    label.style.fontFamily = UITheme.font;
    if (unlocked) {
      const badge = new Graphics().circle(43, 41, 24).fill(UITheme.colors.cream).stroke({ color: UITheme.colors.blue, width: 3 });
      this.addChildAt(badge, this.children.length - 1);
    }
  }
}
