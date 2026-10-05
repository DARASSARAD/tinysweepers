import { Container, Graphics } from 'pixi.js';
import { text } from './Elements';
import { resultTypography } from './ResultTypography';
import { resultPanel, themedButton, UITheme } from './UITheme';

export class LoseScreen extends Container {
  private elapsed = 0;
  private readonly card = new Container();

  constructor(level: number, collected: number, total: number, retry: () => void) {
    super();
    this.card.position.set(540, 950);
    this.addChild(this.card);
    this.card.addChild(resultPanel());
    resultTypography(text(this.card, 'Try again!', 0, -340, 68, UITheme.colors.ink), 'heading');

    // A worried sweeper replaces the win panel's three celebratory stars.
    this.card.addChild(new Graphics()
      .ellipse(0, -90, 135, 20).fill({ color: '#101b31', alpha: 0.12 })
      .moveTo(0, -260).lineTo(0, -290).stroke({ color: '#425d70', width: 10 })
      .circle(0, -302, 16).fill('#ffb62b')
      .roundRect(-122, -254, 244, 158, 36).fill('#425d70')
      .roundRect(-122, -266, 244, 158, 36).fill('#6381b5')
      .roundRect(-105, -246, 210, 110, 26).fill(UITheme.colors.rim)
      .roundRect(-73, -212, 27, 25, 8).fill(UITheme.colors.ink)
      .roundRect(46, -212, 27, 25, 8).fill(UITheme.colors.ink)
      .moveTo(-80, -222).lineTo(-40, -235).stroke({ color: UITheme.colors.ink, width: 7, cap: 'round' })
      .moveTo(40, -235).lineTo(80, -222).stroke({ color: UITheme.colors.ink, width: 7, cap: 'round' })
      .moveTo(-28, -159).lineTo(0, -169).lineTo(28, -159).stroke({ color: UITheme.colors.ink, width: 7, cap: 'round', join: 'round' }));
    resultTypography(text(this.card, 'The docks are stuck', 0, -60, 66, UITheme.colors.ink), 'heading');
    resultTypography(text(this.card, `Give level ${level} another try!`, 0, 25, 42, UITheme.colors.body), 'body');
    this.card.addChild(new Graphics().roundRect(-275, 80, 550, 105, 26).fill(UITheme.colors.rim));
    resultTypography(text(this.card, `${collected} / ${total} blocks collected`, 0, 132, 36, '#246852'), 'body');
    themedButton(this.card, 'Try again', 0, 265, 490, retry);
    const hint = resultTypography(text(this.card, 'Match exposed colors.\nKeep a dock free for your next move.', 0, 425, 31, UITheme.colors.body), 'body');
    hint.style.lineHeight = 43;
    this.card.scale.set(0.85);
  }

  update(delta: number) {
    this.elapsed += delta;
    const t = Math.min(1, this.elapsed / 360);
    this.card.scale.set(0.85 + 0.15 * (1 - (1 - t) ** 3));
  }
}
