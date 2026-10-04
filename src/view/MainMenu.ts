import { Container, Graphics, Rectangle, Sprite, type Texture } from 'pixi.js';
import { button, text } from './Elements';
import { SettingsPanel } from './SettingsPanel';

export class MainMenu extends Container {
  private readonly home = new Container();
  private readonly settings: SettingsPanel;
  private readonly play;
  private readonly level;
  private readonly gold;

  constructor(logoTexture: Texture, onPlay: () => void, onSound: () => void, onMusic: () => void, onHaptics: () => void) {
    super();
    this.settings = new SettingsPanel(() => this.showSettings(false), onSound, onMusic, onHaptics);
    const landscape = new Graphics();
    const stops = [[85, 204, 235], [173, 226, 142], [140, 197, 68], [70, 132, 71]];
    for (let band = 0; band < 96; band++) {
      const position = band / 95 * 3;
      const index = Math.min(2, Math.floor(position));
      const blend = position - index;
      const color = stops[index].map((channel, i) => Math.round(channel + (stops[index + 1][i] - channel) * blend))
        .reduce((value, channel) => value * 256 + channel, 0);
      landscape.rect(0, band * 20, 1080, 21).fill(color);
    }
    landscape.ellipse(140, 320, 280, 180).fill({ color: '#ffffff', alpha: 0.1 })
      .ellipse(980, 780, 520, 290).fill({ color: '#d6f290', alpha: 0.3 })
      .ellipse(130, 1040, 430, 350).fill({ color: '#77bc66', alpha: 0.3 })
      .ellipse(540, 1760, 650, 210).fill({ color: '#3b854f', alpha: 0.25 });
    // Soft foliage frames the scene without adding extra menu features.
    for (const [x, y, radius] of [[-80, 1370, 230], [10, 1500, 180], [-30, 1690, 160], [1110, 1700, 190]]) {
      landscape.circle(x + 15, y + 25, radius).fill('#3f8053')
        .circle(x, y, radius).fill('#559954')
        .ellipse(x - 20, y - radius * 0.3, radius * 0.8, radius * 0.45).fill({ color: '#7cb55d', alpha: 0.6 });
    }
    this.addChild(landscape);
    this.addChild(this.home, this.settings);
    const logo = new Sprite(logoTexture);
    logo.anchor.set(0.5);
    logo.position.set(540, 680);
    logo.scale.set(720 / Math.max(logoTexture.width, logoTexture.height));
    this.home.addChild(logo);
    text(this.home, 'Tiny Sweepers', 540, 1090, 66, '#ffffff');
    this.home.addChild(new Graphics().roundRect(350, 1185, 380, 150, 45).fill('#b93254')
      .roundRect(350, 1175, 380, 150, 45).fill('#ed476c')
      .roundRect(365, 1185, 350, 38, 18).fill({ color: '#ff99b0', alpha: 0.5 }));
    this.level = text(this.home, '', 540, 1250, 52, '#ffffff');
    this.home.addChild(new Graphics().roundRect(180, 1470, 720, 190, 65).fill({ color: '#26482d', alpha: 0.3 })
      .roundRect(180, 1455, 720, 190, 65).fill('#ffefc6')
      .roundRect(195, 1465, 690, 160, 52).fill('#518e16')
      .roundRect(195, 1450, 690, 160, 52).fill('#7cce20')
      .roundRect(220, 1462, 640, 38, 20).fill({ color: '#c5f876', alpha: 0.65 }));
    this.play = button(this.home, 'Play', 540, 1530, 660, onPlay, '#7cce20');
    this.play.label.style.fontSize = 78;
    this.play.label.style.fontWeight = '900';
    this.play.item.hitArea = new Rectangle(-360, -95, 720, 190);
    this.home.addChild(new Graphics().roundRect(190, 120, 370, 110, 55).fill({ color: '#226d83', alpha: 0.65 })
      .circle(210, 175, 59).fill('#bb7d12').circle(210, 168, 55).fill('#ffcb35')
      .circle(210, 168, 43).stroke({ color: '#fff39b', width: 6 })
      .poly([210, 137, 219, 157, 242, 160, 225, 175, 229, 198, 210, 187, 191, 198, 195, 175, 178, 160, 201, 157]).fill('#fff3a0'));
    this.gold = text(this.home, '', 410, 175, 44, '#ffffff');
    const settingsButton = button(this.home, '', 925, 175, 135, () => this.showSettings(true), '#6381b5');
    const gear = new Graphics();
    for (let tooth = 0; tooth < 8; tooth++) {
      const angle = tooth * Math.PI / 4;
      gear.poly([[-7, -34], [7, -34], [7, -21], [-7, -21]].flatMap(([x, y]) =>
        [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle)])).fill('#fffaf0');
    }
    gear.circle(0, 0, 25).fill('#fffaf0').circle(0, 0, 11).fill('#6381b5');
    settingsButton.item.addChild(gear);
    settingsButton.item.label = 'Settings';
    this.showSettings(false);
  }

  refresh(level: number, continuing: boolean, sound: boolean, gold: number, music: boolean, haptics: boolean) {
    this.play.label.text = 'Play';
    this.play.item.label = continuing ? 'Continue saved level' : 'Start game';
    this.level.text = `LEVEL ${level}`;
    this.gold.text = gold.toLocaleString();
    this.settings.refresh(sound, music, haptics);
  }

  showSettings(open: boolean) {
    this.home.visible = !open;
    this.settings.visible = open;
  }
}
