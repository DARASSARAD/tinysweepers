import { Container, Graphics } from 'pixi.js';
import { button, text } from './Elements';
import { resultTypography } from './ResultTypography';

export class LoseScreen extends Container {
  private elapsed = 0;
  private readonly card = new Container();

  constructor(level: number, collected: number, total: number, retry: () => void) {
    super();
    this.card.position.set(540, 950);
    this.addChild(this.card);
    this.card.addChild(new Graphics()
      .roundRect(-415, -410, 830, 940, 60).fill({ color: '#101b31', alpha: 0.3 })
      .roundRect(-415, -430, 830, 940, 60).fill('#fff4df')
      .roundRect(-415, -430, 830, 940, 60).stroke({ color: '#ffffff', width: 8 })
      .roundRect(-310, -468, 620, 112, 35).fill('#ba6720')
      .roundRect(-310, -480, 620, 112, 35).fill('#ffb62b'));
    const heading = resultTypography(text(this.card, 'LEVEL FAILED', 0, -425, 56, '#ffffff'), 'heading');
    heading.style.stroke = { color: '#995017', width: 4 };

    // A worried sweeper replaces the win panel's three celebratory stars.
    this.card.addChild(new Graphics()
      .ellipse(0, -130, 135, 20).fill({ color: '#101b31', alpha: 0.12 })
      .moveTo(0, -300).lineTo(0, -330).stroke({ color: '#425d70', width: 10 })
      .circle(0, -342, 16).fill('#ffb62b')
      .roundRect(-122, -294, 244, 158, 36).fill('#425d70')
      .roundRect(-122, -306, 244, 158, 36).fill('#6381b5')
      .roundRect(-105, -286, 210, 110, 26).fill('#e1f0e7')
      .roundRect(-73, -252, 27, 25, 8).fill('#244d58')
      .roundRect(46, -252, 27, 25, 8).fill('#244d58')
      .moveTo(-80, -262).lineTo(-40, -275).stroke({ color: '#244d58', width: 7, cap: 'round' })
      .moveTo(40, -275).lineTo(80, -262).stroke({ color: '#244d58', width: 7, cap: 'round' })
      .moveTo(-28, -199).lineTo(0, -209).lineTo(28, -199).stroke({ color: '#244d58', width: 7, cap: 'round', join: 'round' }));
    resultTypography(text(this.card, 'The docks are stuck', 0, -60, 66, '#244d58'), 'heading');
    resultTypography(text(this.card, `Give level ${level} another try!`, 0, 25, 42, '#647781'), 'body');
    this.card.addChild(new Graphics().roundRect(-275, 80, 550, 105, 26).fill('#e1f0e7'));
    resultTypography(text(this.card, `${collected} / ${total} blocks collected`, 0, 132, 36, '#246852'), 'body');
    const primary = button(this.card, 'TRY AGAIN', 0, 265, 490, retry, '#14aa78');
    primary.item.addChildAt(new Graphics()
      .roundRect(-242, -38, 490, 120, 30).fill({ color: '#19243c', alpha: 0.18 })
      .roundRect(-245, -40, 490, 120, 30).fill('#08794f'), 0);
    primary.item.addChildAt(new Graphics().moveTo(-213, -53).lineTo(213, -53)
      .stroke({ color: '#ffffff', alpha: 0.35, width: 5 }), 2);
    resultTypography(primary.label, 'button').style.fontSize = 44;
    const hint = resultTypography(text(this.card, 'Match exposed colors.\nKeep a dock free for your next move.', 0, 425, 31, '#647781'), 'body');
    hint.style.lineHeight = 43;
    this.card.scale.set(0.85);
  }

  update(delta: number) {
    this.elapsed += delta;
    const t = Math.min(1, this.elapsed / 360);
    this.card.scale.set(0.85 + 0.15 * (1 - (1 - t) ** 3));
  }
}
