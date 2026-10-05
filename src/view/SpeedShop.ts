import { Container, Graphics } from 'pixi.js';
import { text } from './Elements';
import { coinIcon } from './CoinIcon';
import { themedButton, UITheme } from './UITheme';

export const speedOffers = [
  { minutes: 8, price: 500, color: '#edb535' },
  { minutes: 18, price: 1000, color: '#6381b5' },
  { minutes: 40, price: 2500, color: '#a27adb' },
  { minutes: 90, price: 5000, color: '#ed476c' },
] as const;

export class SpeedShop extends Container {
  constructor(balance: number, buy: (minutes: number, price: number) => void, close: () => void,
    watchAd: () => void, adAvailable: boolean) {
    super();
    this.label = 'Speed Up shop';
    const shade = new Graphics().rect(0, 0, 1080, 1920).fill({ color: '#173d35', alpha: 0.7 });
    shade.eventMode = 'static'; shade.on('pointertap', close); this.addChild(shade);
    const card = new Container(); this.addChild(card);
    const label = (value: string, x: number, y: number, size: number) => {
      const item = text(card, value, x, y, size, UITheme.colors.ink);
      item.style.fontFamily = UITheme.font; item.style.fontWeight = '900';
      return item;
    };
    card.addChild(new Graphics().roundRect(130, 360, 820, 180, 55).fill(UITheme.colors.rim)
      .roundRect(140, 350, 800, 175, 50).fill(UITheme.colors.header));
    label('Speed Up', 540, 420, 68);
    label('Double speed • Your coins: ' + balance.toLocaleString(), 540, 490, 28);
    speedOffers.forEach((offer, index) => {
      const y = 690 + index * 230;
      card.addChild(new Graphics().roundRect(100, y - 95, 880, 195, 40).fill(UITheme.colors.rim)
        .roundRect(112, y - 83, 856, 168, 32).fill(UITheme.colors.cream)
        .roundRect(340, y - 65, 220, 130, 22).fill('#f3dfba'));
      const clock = new Graphics().roundRect(205, y - 88, 40, 30, 10).fill(UITheme.colors.blue)
        .circle(225, y - 8, 66).fill(offer.color).circle(225, y - 8, 50).fill(UITheme.colors.cream)
        .moveTo(225, y - 43).lineTo(225, y - 8).lineTo(250, y + 8)
        .stroke({ color: UITheme.colors.ink, width: 8, cap: 'round' });
      card.addChild(clock);
      label('» 2×', 225, y + 53, 42);
      label(`${offer.minutes} min`, 450, y, 44);
      const purchase = themedButton(card, offer.price.toLocaleString(), 760, y, 320,
        () => buy(offer.minutes, offer.price));
      purchase.item.label = `Buy ${offer.minutes} minutes of 2x speed`;
      purchase.label.x = -25; purchase.label.style.fontSize = 40;
      purchase.item.addChild(coinIcon(110, 0, 25));
      if (balance < offer.price) {
        purchase.item.eventMode = 'none'; purchase.item.alpha = 0.45; purchase.item.cursor = 'default';
      }
    });
    card.addChild(new Graphics().roundRect(100, 1515, 880, 195, 40).fill(UITheme.colors.rim)
      .roundRect(112, 1527, 856, 168, 32).fill(UITheme.colors.blue));
    label('» 2×', 225, 1610, 48).style.fill = UITheme.colors.cream;
    label('3 min', 450, 1610, 44).style.fill = UITheme.colors.cream;
    const ad = themedButton(card, adAvailable ? 'Watch Ad' : 'Ad unavailable', 760, 1610, 320, watchAd);
    ad.item.label = 'Watch ad for 3 minutes of 2x speed';
    ad.label.style.fontSize = adAvailable ? 38 : 29;
    if (!adAvailable) { ad.item.eventMode = 'none'; ad.item.alpha = 0.55; ad.item.cursor = 'default'; }
    label('Tap outside to return', 540, 1780, 36).style.fill = UITheme.colors.cream;
    const cross = themedButton(card, '×', 925, 370, 90, close, 'blue');
    cross.item.label = 'Close speed shop';
  }
}
