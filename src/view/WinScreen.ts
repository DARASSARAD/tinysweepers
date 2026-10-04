import { Container, Graphics } from 'pixi.js';
import { button, text } from './Elements';
import { resultTypography } from './ResultTypography';

export class WinScreen extends Container {
  private elapsed = 0;
  private readonly card = new Container();
  private readonly confetti: Graphics[] = [];
  constructor(level: number, cubes: number, lastLevel: boolean, next: () => void, replay: () => void) {
    super();
    this.card.position.set(540, 950);
    this.addChild(this.card);
    this.card.addChild(new Graphics()
      .roundRect(-415, -410, 830, 940, 60).fill({ color: '#101b31', alpha: 0.3 })
      .roundRect(-415, -430, 830, 940, 60).fill('#fff4df')
      .roundRect(-415, -430, 830, 940, 60).stroke({ color: '#ffffff', width: 8 })
      .roundRect(-310, -468, 620, 112, 35).fill('#ba6720')
      .roundRect(-310, -480, 620, 112, 35).fill('#ffb62b'));
    const heading = resultTypography(text(this.card, 'LEVEL COMPLETE!', 0, -425, 56, '#ffffff'), 'heading');
    heading.style.stroke = { color: '#995017', width: 4 };
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 180; const y = i === 1 ? -240 : -205;
      const points = Array.from({ length: 20 }, (_, j) => {
        const angle = Math.floor(j / 2) * Math.PI / 5 - Math.PI / 2;
        const radius = Math.floor(j / 2) % 2 === 0 ? 83 : 40;
        return j % 2 === 0 ? x + Math.cos(angle) * radius : y + Math.sin(angle) * radius;
      });
      this.card.addChild(new Graphics().poly(points.map((v, j) => j % 2 ? v + 8 : v)).fill('#d48214')
        .poly(points).fill('#ffdc43').stroke({ color: '#fff3a0', width: 5 }));
    }
    resultTypography(text(this.card, 'Squeaky clean!', 0, -60, 80, '#244d58'), 'heading');
    resultTypography(text(this.card, `Level ${level} cleared`, 0, 25, 44, '#647781'), 'body');
    this.card.addChild(new Graphics().roundRect(-275, 80, 550, 105, 26).fill('#e1f0e7'));
    resultTypography(text(this.card, `${cubes} blocks collected`, 0, 132, 42, '#246852'), 'body');
    const primary = button(this.card, lastLevel ? 'PLAY AGAIN' : 'NEXT LEVEL  ›', 0, 265, 490, next, '#14aa78');
    const raisedButton = (control: ReturnType<typeof button>, width: number, base: string) => {
      control.item.addChildAt(new Graphics()
        .roundRect(-width / 2 + 3, -38, width, 120, 30).fill({ color: '#19243c', alpha: 0.18 })
        .roundRect(-width / 2, -40, width, 120, 30).fill(base), 0);
      control.item.addChildAt(new Graphics()
        .moveTo(-width / 2 + 32, -53).lineTo(width / 2 - 32, -53)
        .stroke({ color: '#ffffff', alpha: 0.35, width: 5 }), 2);
      resultTypography(control.label, 'button').style.fontSize = 44;
    };
    raisedButton(primary, 490, '#08794f');
    const replayButton = button(this.card, 'Replay level', 0, 425, 390, replay, '#698595');
    raisedButton(replayButton, 390, '#425d70');
    const colors = ['#ffdc43', '#ff638a', '#23d6c3', '#ac7aff', '#ffffff'];
    for (let i = 0; i < 44; i++) {
      const piece = new Graphics().roundRect(-6, -11, 12, 22, 3).fill(colors[i % colors.length]);
      piece.position.set(65 + (i * 137) % 950, -200 + (i * 97) % 1900);
      piece.rotation = i * 0.8;
      this.confetti.push(piece);
      this.addChild(piece);
    }
    this.card.scale.set(0.85);
  }
  update(delta: number) {
    this.elapsed += delta;
    const t = Math.min(1, this.elapsed / 360);
    this.card.scale.set(0.85 + 0.15 * (1 - (1 - t) ** 3));
    for (const [i, piece] of this.confetti.entries()) {
      piece.y += delta * (0.12 + (i % 5) * 0.018);
      piece.x += Math.sin(this.elapsed / 600 + i) * delta * 0.025;
      piece.rotation += delta * 0.0015;
      if (piece.y > 1940) piece.y = -30;
    }
  }
}
