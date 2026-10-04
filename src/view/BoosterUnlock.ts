import { Container, Graphics } from 'pixi.js';
import { button, text } from './Elements';
import { resultTypography } from './ResultTypography';

export class BoosterUnlock extends Container {
  constructor(onClaim: () => void) {
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
    card.addChild(cards);
    resultTypography(text(card, 'Booster Unlock', 0, -422, 58, '#ffffff'), 'heading');
    resultTypography(text(card, 'Choose Any Crate', 0, 65, 53, '#875138'), 'heading');
    resultTypography(text(card, 'Send one buried crate to a dock.', 0, 145, 31, '#875138'), 'body');
    resultTypography(text(card, '+1 powerup · try the extra crate!', 0, 207, 29, '#875138'), 'body');
    const claim = button(card, 'Claim', 0, 350, 350, onClaim, '#79d527');
    claim.item.addChildAt(new Graphics().roundRect(-175, -44, 350, 120, 30).fill('#398d17'), 0);
    claim.item.addChildAt(new Graphics().roundRect(-168, -54, 336, 108, 26)
      .stroke({ color: '#d8ff8b', width: 4 }), 2);
    resultTypography(claim.label, 'button').style.fontSize = 57;
    claim.label.style.stroke = { color: '#3b771b', width: 3 };
  }
}
