import { Container, Graphics } from 'pixi.js';
import { button, text } from './Elements';
import { resultTypography } from './ResultTypography';
import { BoosterButton } from './BoosterButton';

export class BoosterUnlock extends Container {
  constructor(onClaim: () => void, kind: 'cratePicker' | 'shuffle' | 'bigVacuum' = 'cratePicker') {
    super();
    const backdrop = new Graphics().rect(-10000, -10000, 20000, 20000)
      .fill({ color: '#17130e', alpha: 0.78 });
    backdrop.eventMode = 'static';
    this.addChild(backdrop);
    const card = new Container();
    card.position.set(540, 950);
    this.addChild(card);
    card.addChild(new Graphics()
      .roundRect(-350, -430, 700, 940, 58).fill('#936039')
      .roundRect(-350, -450, 700, 940, 58).fill('#ffe9d0')
      .roundRect(-350, -450, 700, 940, 58).stroke({ color: '#dfab70', width: 10 })
      .roundRect(-315, -490, 630, 165, 42).fill('#a56930')
      .roundRect(-315, -505, 630, 165, 42).fill('#d78a3b')
      .roundRect(-305, -495, 610, 145, 36).stroke({ color: '#ffc879', width: 5 })
      .ellipse(0, -45, 130, 22).fill({ color: '#8b5835', alpha: 0.2 })
      .roundRect(-105, -125, 210, 95, 22).fill('#9c633d').stroke({ color: '#734c36', width: 6 }));
    const cards = new Container();
    cards.rotation = -0.16;
    cards.addChild(new Graphics()
      .roundRect(-70, -255, 135, 175, 20).fill('#d2d5db').stroke({ color: '#6e7078', width: 6 })
      .roundRect(-50, -235, 135, 175, 20).fill('#fafafa').stroke({ color: '#8a8d94', width: 6 })
      .roundRect(-25, -180, 55, 155, 12).fill('#63dd27').stroke({ color: '#388914', width: 6 })
      .roundRect(-75, -130, 155, 55, 12).fill('#63dd27').stroke({ color: '#388914', width: 6 }));
    if (kind === 'cratePicker') card.addChild(cards);
    else {
      cards.destroy({ children: true });
      const icon = new BoosterButton(kind, 0, () => {});
      icon.refresh(10, 0, 1);
      for (const child of icon.removeChildren(1)) child.destroy({ children: true });
      icon.position.set(0, -200);
      icon.scale.set(1.6);
      icon.eventMode = 'none';
      card.addChild(icon);
    }
    resultTypography(text(card, 'Booster Unlock', 0, -422, 58, '#ffffff'), 'heading');
    const title = kind === 'cratePicker' ? 'Choose Any Crate' : kind === 'shuffle' ? 'Shuffle' : 'Big Vacuum';
    const description = kind === 'cratePicker' ? 'Send one buried crate to a dock.' : kind === 'shuffle'
      ? 'Bring a needed crate to the front.' : 'Clear one entire color\nand all matching crates.';
    resultTypography(text(card, title, 0, 65, 53, '#875138'), 'heading');
    resultTypography(text(card, description, 0, 145, 31, '#875138'), 'body');
    resultTypography(text(card, kind === 'cratePicker' ? '+1 powerup · try the extra crate!' : '+1 powerup · try it now!', 0, 207, 29, '#875138'), 'body');
    const claim = button(card, kind === 'cratePicker' ? 'Claim' : 'Try it', 0, 350, 350, onClaim, '#79d527');
    claim.item.addChildAt(new Graphics().roundRect(-175, -44, 350, 120, 30).fill('#398d17'), 0);
    claim.item.addChildAt(new Graphics().roundRect(-168, -54, 336, 108, 26)
      .stroke({ color: '#d8ff8b', width: 4 }), 2);
    resultTypography(claim.label, 'button').style.fontSize = 57;
    claim.label.style.stroke = { color: '#3b771b', width: 3 };
  }
}
