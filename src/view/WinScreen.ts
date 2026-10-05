import { Container, Graphics } from 'pixi.js';
import { text } from './Elements';
import { resultTypography } from './ResultTypography';
import { coinIcon } from './CoinIcon';
import { CoinRewardTimeline } from './CoinRewardTimeline';
import { resultPanel, themedButton, UITheme } from './UITheme';

export class WinScreen extends Container {
  private elapsed = 0;
  private readonly card = new Container();
  private readonly confetti: Graphics[] = [];
  private readonly timeline = new CoinRewardTimeline();
  private readonly coins: { icon: Graphics; landed: boolean; x: number; y: number }[] = [];
  private readonly actions: Container[] = [];
  private adPending = false;
  private doubled = false;
  get ready() { return !this.adPending; }
  constructor(level: number, lastLevel: boolean, next: () => void, doubleRewards: () => Promise<boolean>,
    private readonly onCoinArrival: () => void, rewardedAvailable = false) {
    super();
    this.card.position.set(540, 950);
    this.addChild(this.card);
    this.card.addChild(resultPanel());
    resultTypography(text(this.card, 'Level complete!', 0, -340, 60, UITheme.colors.ink), 'heading');
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 180; const y = i === 1 ? -180 : -155;
      const points = Array.from({ length: 20 }, (_, j) => {
        const angle = Math.floor(j / 2) * Math.PI / 5 - Math.PI / 2;
        const radius = Math.floor(j / 2) % 2 === 0 ? 83 : 40;
        return j % 2 === 0 ? x + Math.cos(angle) * radius : y + Math.sin(angle) * radius;
      });
      this.card.addChild(new Graphics().poly(points).fill('#ffd447').stroke({ color: '#fff0b0', width: 5 }));
    }
    resultTypography(text(this.card, 'Squeaky clean!', 0, -30, 70, UITheme.colors.ink), 'heading');
    resultTypography(text(this.card, `Level ${level} cleared`, 0, 40, 42, UITheme.colors.body), 'body');
    this.card.addChild(new Graphics().roundRect(-275, 80, 550, 105, 26).fill(UITheme.colors.rim));
    const rewardText = resultTypography(text(this.card, '+50 coins', 0, 132, 48, UITheme.colors.gold), 'body');
    const nextButton = themedButton(this.card, lastLevel ? 'Play again' : 'Next level', 0, 265, 490,
      () => { if (this.ready) next(); });
    const rewardButton = themedButton(this.card, '2x Rewards', 0, 425, 390,
      () => { void watchAd(); }, 'blue');
    rewardButton.item.visible = rewardedAvailable;
    const badge = new Container();
    badge.position.set(-175, -56);
    badge.addChild(new Graphics().roundRect(-45, -30, 90, 60, 15).fill(UITheme.colors.cream)
      .roundRect(-30, -20, 44, 40, 7).stroke({ color: UITheme.colors.blueBase, width: 4 })
      .poly([-17, -11, -17, 11, -2, 0]).fill(UITheme.colors.blueBase));
    const adLabel = text(badge, 'AD', 28, 0, 16, UITheme.colors.ink);
    adLabel.style.fontFamily = UITheme.font;
    badge.eventMode = 'none';
    rewardButton.item.addChild(badge);
    const feedback = resultTypography(text(this.card, '', 0, 335, 25, UITheme.colors.body), 'body');
    this.actions.push(nextButton.item, rewardButton.item);
    const watchAd = async () => {
      if (!rewardedAvailable || !this.ready || this.doubled) return;
      this.adPending = true;
      for (const action of this.actions) { action.eventMode = 'none'; action.alpha = 0.45; }
      rewardButton.label.text = 'Loading ad…';
      feedback.text = '';
      let completed = false;
      try { completed = await doubleRewards(); } catch { /* A failed ad grants no bonus. */ }
      this.adPending = false;
      if (this.destroyed) return;
      if (completed) {
        this.doubled = true;
        rewardText.text = '+100 coins';
        rewardButton.label.text = 'Reward doubled!';
        this.timeline.elapsed = 0;
        for (const coin of this.coins) { coin.landed = false; coin.icon.visible = false; }
      } else {
        rewardButton.label.text = '2x Rewards';
        feedback.text = 'Ad unavailable or unfinished. Try again.';
      }
    };
    for (const action of this.actions) { action.eventMode = 'static'; action.alpha = 1; action.cursor = 'pointer'; }
    const colors = ['#ffdc43', '#ff638a', '#23d6c3', '#ac7aff', '#ffffff'];
    for (let i = 0; i < 44; i++) {
      const piece = new Graphics().roundRect(-6, -11, 12, 22, 3).fill(colors[i % colors.length]);
      piece.position.set(65 + (i * 137) % 950, -200 + (i * 97) % 1900);
      piece.rotation = i * 0.8;
      this.confetti.push(piece);
      this.addChild(piece);
    }
    this.card.scale.set(0.85);
    for (let index = 0; index < this.timeline.count; index++) {
      const angle = index * Math.PI * 2 / this.timeline.count;
      const x = 540 + Math.cos(angle) * (65 + index % 3 * 25);
      const y = 1082 + Math.sin(angle) * 70;
      const icon = coinIcon(0, 0, 32);
      icon.visible = false;
      icon.eventMode = 'none';
      this.coins.push({ icon, landed: false, x, y });
      this.addChild(icon);
    }
  }
  update(delta: number) {
    this.elapsed += delta;
    this.timeline.update(delta);
    const t = Math.min(1, this.elapsed / 360);
    this.card.scale.set(0.85 + 0.15 * (1 - (1 - t) ** 3));
    for (const [i, piece] of this.confetti.entries()) {
      piece.y += delta * (0.12 + (i % 5) * 0.018);
      piece.x += Math.sin(this.elapsed / 600 + i) * delta * 0.025;
      piece.rotation += delta * 0.0015;
      if (piece.y > 1940) piece.y = -30;
    }
    for (const [index, coin] of this.coins.entries()) {
      const phase = this.timeline.phase(index);
      if (phase < 0 || coin.landed) continue;
      coin.icon.visible = true;
      const pop = Math.min(1, phase / this.timeline.popMs);
      const flight = Math.max(0, Math.min(1, (phase - this.timeline.popMs - this.timeline.holdMs) / this.timeline.flightMs));
      const eased = flight * flight;
      coin.icon.position.set(coin.x + (90 - coin.x) * eased,
        coin.y + (108 - coin.y) * eased - Math.sin(flight * Math.PI) * 180);
      coin.icon.scale.set((1 - (1 - pop) ** 3) * (1 - flight * 0.25));
      if (flight === 1) {
        coin.landed = true;
        coin.icon.visible = false;
        this.onCoinArrival();
      }
    }
    if (this.ready) for (const [index, action] of this.actions.entries()) {
      const enabled = index === 0 || !this.doubled;
      action.eventMode = enabled ? 'static' : 'none'; action.alpha = enabled ? 1 : 0.6;
      action.cursor = enabled ? 'pointer' : 'default';
    }
  }
}
