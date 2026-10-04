import { Container, Graphics, Rectangle } from 'pixi.js';
import { button, text } from './Elements';

export class SettingsPanel extends Container {
  private readonly switches: { track: Graphics; label: ReturnType<typeof text> }[] = [];
  private confirmation: Container | null = null;

  constructor(onClose: () => void, onSound: () => void, onMusic: () => void, onHaptics: () => void,
    actions?: { replay: () => void; home: () => void }) {
    super();
    const backdrop = new Graphics().rect(0, 0, 1080, 1920).fill({ color: '#173d35', alpha: 0.5 });
    backdrop.eventMode = 'static';
    this.addChild(backdrop);
    this.addChild(new Graphics().roundRect(155, 470, 770, 1000, 65).fill({ color: '#254a2e', alpha: 0.3 })
      .roundRect(155, 450, 770, 1000, 65).fill('#ffedba')
      .roundRect(170, 465, 740, 970, 55).fill('#fff8de')
      .roundRect(170, 465, 740, 220, 55).fill('#a9df71')
      .rect(170, 575, 740, 110).fill('#a9df71')
      .roundRect(200, 485, 650, 30, 15).fill({ color: '#e3ffbd', alpha: 0.7 }));
    const heading = text(this, 'Settings', 540, 590, 76, '#36582b');
    heading.style.fontFamily = 'Trebuchet MS, Arial Rounded MT Bold, sans-serif';
    heading.style.fontWeight = '900';
    heading.style.stroke = { color: '#e6ffc5', width: 3, join: 'round' };
    for (const [index, [title, onTap]] of ([['Sound effects', onSound], ['Music', onMusic], ['Haptics', onHaptics]] as const).entries()) {
      const row = new Container();
      row.position.set(260, actions ? 800 + index * 170 : 820 + index * 200);
      const titleText = text(row, title, 165, 0, 44, '#74633a');
      titleText.style.fontFamily = 'Trebuchet MS, Arial Rounded MT Bold, sans-serif';
      titleText.style.fontWeight = '800';
      titleText.eventMode = 'none';
      const track = new Graphics();
      track.eventMode = 'none';
      row.addChild(track);
      const label = text(row, '', 460, 0, 28, '#ffffff');
      label.style.fontFamily = 'Trebuchet MS, Arial Rounded MT Bold, sans-serif';
      label.style.fontWeight = '900';
      label.eventMode = 'none';
      row.eventMode = 'static';
      row.cursor = 'pointer';
      row.label = `Toggle ${title.toLowerCase()}`;
      row.hitArea = new Rectangle(-30, -70, 630, 140);
      row.on('pointertap', onTap);
      this.switches.push({ track, label });
      this.addChild(row);
    }
    const close = new Container();
    close.position.set(880, 490);
    close.addChild(new Graphics().roundRect(-55, -50, 110, 110, 30).fill('#a52c44')
      .roundRect(-55, -60, 110, 110, 30).fill('#ed476c')
      .roundRect(-55, -60, 110, 110, 30).stroke({ color: '#fff0cb', width: 6 })
      .moveTo(-20, -25).lineTo(20, 15).moveTo(20, -25).lineTo(-20, 15)
      .stroke({ color: '#ffffff', width: 12, cap: 'round' }));
    close.eventMode = 'static';
    close.cursor = 'pointer';
    close.label = 'Close settings';
    close.hitArea = new Rectangle(-65, -70, 130, 130);
    close.on('pointertap', onClose);
    this.addChild(close);
    if (actions) {
      for (const [index, action] of ['replay', 'home'].entries()) {
        const item = button(this, '', 410 + index * 260, 1350, 200,
          action === 'replay' ? actions.replay : actions.home, action === 'replay' ? '#7cce20' : '#6381b5').item;
        item.label = action === 'replay' ? 'Replay level' : 'Main menu';
        const icon = new Graphics();
        if (action === 'replay') {
          icon.arc(0, 0, 32, -Math.PI * 0.35, Math.PI * 1.4).stroke({ color: '#fffbe7', width: 10, cap: 'round' })
            .poly([-7, -43, 14, -26, -13, -17]).fill('#fffbe7');
        } else {
          icon.poly([-44, -3, 0, -40, 44, -3]).fill('#fffbe7')
            .roundRect(-30, -5, 60, 44, 5).fill('#fffbe7')
            .rect(-9, 13, 18, 27).fill('#6381b5');
        }
        icon.eventMode = 'none';
        item.addChild(icon);
      }
    }
  }

  dismissConfirmation() {
    if (!this.confirmation) return false;
    this.confirmation.destroy({ children: true });
    this.confirmation = null;
    return true;
  }

  confirm(action: 'replay' | 'home', onYes: () => void) {
    this.dismissConfirmation();
    const popup = new Container();
    const shade = new Graphics().rect(0, 0, 1080, 1920).fill({ color: '#173d35', alpha: 0.65 });
    shade.eventMode = 'static';
    popup.addChild(shade, new Graphics().roundRect(160, 660, 760, 600, 55).fill('#fff8de')
      .roundRect(160, 660, 760, 600, 55).stroke({ color: '#a9df71', width: 12 }));
    const title = text(popup, action === 'replay' ? 'Replay level?' : 'Return home?', 540, 780, 60, '#36582b');
    title.style.fontFamily = 'Trebuchet MS, sans-serif';
    title.style.fontWeight = '900';
    const message = text(popup, action === 'replay' ? 'Your current attempt will restart.' : 'Your current puzzle will wait for you.', 540, 920, 32, '#74633a');
    message.style.fontFamily = 'Trebuchet MS, sans-serif';
    button(popup, 'Yes', 380, 1110, 260, () => { this.dismissConfirmation(); onYes(); }, '#7cce20');
    button(popup, 'No', 700, 1110, 260, () => this.dismissConfirmation(), '#ed476c');
    this.confirmation = popup;
    this.addChild(popup);
  }

  refresh(sound: boolean, music: boolean, haptics: boolean) {
    [sound, music, haptics].forEach((enabled, index) => {
      const { track, label } = this.switches[index];
      track.clear().roundRect(380, -40, 190, 80, 40).fill(enabled ? '#508823' : '#8b968d')
        .roundRect(380, -46, 190, 80, 40).fill(enabled ? '#7cce20' : '#b2b9ae')
        .circle(enabled ? 535 : 415, -6, 29).fill('#fffbe7');
      label.text = enabled ? 'ON' : 'OFF';
      label.x = enabled ? 445 : 505;
    });
  }
}
