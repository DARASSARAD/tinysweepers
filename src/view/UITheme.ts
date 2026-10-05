import { Container, Graphics } from 'pixi.js';
import { button } from './Elements';

export const UITheme = {
  font: 'Trebuchet MS, Arial Rounded MT Bold, sans-serif',
  colors: { cream: '#fff8de', rim: '#ffedba', header: '#a9df71', ink: '#36582b', body: '#74633a',
    green: '#7cce20', greenBase: '#508823', blue: '#6381b5', blueBase: '#425d70', pink: '#ed476c', gold: '#a66b16' },
};

export function resultPanel() {
  const c = UITheme.colors;
  return new Graphics().roundRect(-415, -410, 830, 940, 60).fill({ color: '#254a2e', alpha: 0.3 })
    .roundRect(-415, -430, 830, 940, 60).fill(c.rim)
    .roundRect(-400, -415, 800, 910, 50).fill(c.cream)
    .roundRect(-400, -415, 800, 150, 50).fill(c.header)
    .rect(-400, -340, 800, 75).fill(c.header)
    .roundRect(-370, -397, 740, 20, 10).fill({ color: '#e3ffbd', alpha: 0.7 });
}

export function themedButton(parent: Container, label: string, x: number, y: number, width: number,
  onTap: () => void, kind: 'green' | 'blue' = 'green') {
  const c = UITheme.colors;
  const control = button(parent, label, x, y, width, onTap, c[kind]);
  const background = control.item.children[0] as Graphics;
  background.clear().roundRect(-width / 2 - 7, -65, width + 14, 140, 35).fill(c.rim)
    .roundRect(-width / 2, -53, width, 120, 30).fill(kind === 'green' ? c.greenBase : c.blueBase)
    .roundRect(-width / 2, -60, width, 120, 30).fill(c[kind])
    .roundRect(-width / 2 + 15, -52, width - 30, 16, 8).fill({ color: '#ffffff', alpha: 0.3 });
  control.label.style.fontFamily = UITheme.font;
  control.label.style.fontWeight = '900';
  control.label.style.fontSize = 44;
  return control;
}

export function settingsGear(parent: Container, x: number, y: number, onTap: () => void) {
  const control = themedButton(parent, '', x, y, 120, onTap, 'blue');
  const gear = new Graphics();
  for (let tooth = 0; tooth < 8; tooth++) {
    const angle = tooth * Math.PI / 4;
    gear.poly([[-7, -34], [7, -34], [7, -21], [-7, -21]].flatMap(([px, py]) =>
      [px * Math.cos(angle) - py * Math.sin(angle), px * Math.sin(angle) + py * Math.cos(angle)])).fill(UITheme.colors.cream);
  }
  gear.circle(0, 0, 25).fill(UITheme.colors.cream).circle(0, 0, 11).fill(UITheme.colors.blue);
  gear.eventMode = 'none';
  control.item.addChild(gear);
  control.item.label = 'Settings';
  return control;
}
