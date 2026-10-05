import { Container, Graphics } from 'pixi.js';
import { text } from './Elements';
import { BoosterButton } from './BoosterButton';
import { coinIcon } from './CoinIcon';
import { resultPanel, themedButton, UITheme } from './UITheme';

export type BoosterKind = 'cratePicker' | 'shuffle' | 'bigVacuum';
export const boosterPrices: Record<BoosterKind, number> = { cratePicker: 1000, shuffle: 1500, bigVacuum: 2000 };

export class BoosterShop extends Container {
  constructor(kind: BoosterKind, balance: number, buy: () => void, close: () => void) {
    super();
    const shade = new Graphics().rect(0, 0, 1080, 1920).fill({ color: '#173d35', alpha: 0.65 });
    shade.eventMode = 'static'; this.addChild(shade);
    const card = new Container(); card.position.set(540, 950); this.addChild(card);
    card.addChild(resultPanel());
    const label = (value: string, y: number, size: number, color = UITheme.colors.ink) => {
      const item = text(card, value, 0, y, size, color);
      item.style.fontFamily = UITheme.font; item.style.fontWeight = '900'; item.style.align = 'center';
      return item;
    };
    label('Booster shop', -340, 60);
    const icon = new BoosterButton(kind, 0, () => {});
    icon.refresh(10, 0, 1); icon.position.set(0, -150); icon.scale.set(1.6); icon.eventMode = 'none'; card.addChild(icon);
    label(kind === 'cratePicker' ? 'Choose Any Crate' : kind === 'shuffle' ? 'Shuffle' : 'Big Vacuum', 10, 52);
    const details = label(kind === 'cratePicker' ? 'Send one buried crate to a dock.' : kind === 'shuffle'
      ? 'Bring a needed crate to the front.' : 'Clear one entire color\nand all matching crates.', 95, 32, UITheme.colors.body);
    details.style.fontWeight = '600';
    card.addChild(coinIcon(-140, 200, 30));
    const price = text(card, boosterPrices[kind].toLocaleString(), 30, 200, 48, UITheme.colors.gold);
    price.style.fontFamily = UITheme.font; price.style.fontWeight = '900';
    const affordable = balance >= boosterPrices[kind];
    const purchase = themedButton(card, 'Buy 1', -185, 325, 320, buy);
    if (!affordable) { purchase.item.eventMode = 'none'; purchase.item.alpha = 0.45; purchase.item.cursor = 'default'; }
    const ad = themedButton(card, 'Watch Ad', 185, 325, 320, () => {}, 'blue');
    ad.item.removeAllListeners('pointertap');
    ad.item.eventMode = 'none'; ad.item.cursor = 'default';
    ad.item.label = 'Watch ad for 1 powerup (placeholder)';
    ad.label.style.fontSize = 36;
    label(affordable ? `Your coins: ${balance.toLocaleString()}`
      : `Need ${(boosterPrices[kind] - balance).toLocaleString()} more coins`, 440, 30, UITheme.colors.body);
    const cross = themedButton(card, '×', 390, -405, 100, close, 'blue');
    const face = cross.item.children[0] as Graphics;
    face.clear().roundRect(-50, -50, 100, 100, 25).fill(UITheme.colors.pink)
      .roundRect(-50, -50, 100, 100, 25).stroke({ color: UITheme.colors.cream, width: 5 });
    cross.label.style.fontSize = 68; cross.item.label = 'Close booster shop';
  }
}
