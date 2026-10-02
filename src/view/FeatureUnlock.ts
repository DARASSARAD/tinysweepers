import { Container, Graphics } from 'pixi.js';
import { button, text } from './Elements';
import { resultTypography } from './ResultTypography';

export class FeatureUnlock extends Container {
  constructor(onClaim: () => void) {
    super();
    const backdrop = new Graphics().rect(0, 0, 1080, 1920).fill({ color: '#17130e', alpha: 0.72 });
    backdrop.eventMode = 'static';
    this.addChild(backdrop);
    const card = new Container();
    card.position.set(540, 950);
    this.addChild(card);
    card.addChild(new Graphics()
      .roundRect(-350, -420, 700, 880, 58).fill('#89603d')
      .roundRect(-350, -440, 700, 880, 58).fill('#ffeacf')
      .roundRect(-350, -440, 700, 880, 58).stroke({ color: '#e3b782', width: 10 })
      .roundRect(-315, -482, 630, 170, 42).fill('#ae7135')
      .roundRect(-315, -500, 630, 170, 42).fill('#e69a43')
      .roundRect(-305, -490, 610, 150, 36).stroke({ color: '#ffd18a', width: 5 })
      .roundRect(-305, -270, 610, 270, 40).fill('#f5d3a8')
      .roundRect(-305, -270, 610, 270, 40).stroke({ color: '#edc397', width: 5 })
      .ellipse(0, -40, 155, 17).fill({ color: '#b08251', alpha: 0.15 })
      .moveTo(-60, -150).lineTo(80, -105).stroke({ color: '#9b762c', width: 15 })
      .moveTo(-60, -153).lineTo(80, -108).stroke({ color: '#ffe67a', width: 7 }));
    for (const [x, y, color, base] of [
      [-80, -175, '#ffdc48', '#dc8c19'], [80, -130, '#25c9f3', '#088ba9'],
    ] as const) {
      card.addChild(new Graphics()
        .roundRect(x - 49, y - 37, 98, 106, 20).fill(base)
        .roundRect(x - 49, y - 49, 98, 98, 20).fill(color)
        .roundRect(x - 49, y - 49, 98, 98, 20).stroke({ color: '#755533', width: 3 })
        .moveTo(x - 30, y - 42).lineTo(x + 30, y - 42).stroke({ color: '#ffffff', alpha: 0.55, width: 4 }));
    }
    const title = resultTypography(text(card, 'Feature Unlock', 0, -415, 61, '#ffffff'), 'heading');
    title.style.stroke = { color: '#a56a33', width: 3 };
    const name = resultTypography(text(card, 'Connected Boxes', 0, 65, 62, '#ffffff'), 'heading');
    name.style.stroke = { color: '#98694b', width: 3 };
    resultTypography(text(card, 'More boxes, more fun.', 0, 140, 39, '#875138'), 'heading');
    resultTypography(text(card, 'Move both together into two free docks.', 0, 202, 28, '#875138'), 'body');
    const claim = button(card, 'Claim', 0, 328, 350, onClaim, '#79d527');
    claim.item.addChildAt(new Graphics().roundRect(-175, -44, 350, 120, 30).fill('#398d17'), 0);
    claim.item.addChildAt(new Graphics().roundRect(-168, -54, 336, 108, 26)
      .stroke({ color: '#d8ff8b', width: 4 }), 2);
    resultTypography(claim.label, 'button').style.fontSize = 57;
    claim.label.style.stroke = { color: '#3b771b', width: 3 };
  }
}
