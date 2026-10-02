import { Container, Graphics, Text } from 'pixi.js';
import { Config } from '../core/Config';
import type { GameModel } from '../logic/GameModel';
import { text } from './Elements';

export class TutorialView extends Container {
  private readonly highlight = new Graphics();
  private readonly shade = new Graphics();
  private readonly hintText: Text;
  private readonly hand: Text;
  private dismissed = false;
  private pulse = 0;
  constructor() {
    super();
    this.eventMode = 'none';
    this.addChild(this.shade, this.highlight);
    this.addChild(new Graphics().roundRect(100, 925, 880, 170, 36).fill('#fff9e9')
      .roundRect(100, 925, 880, 170, 36).stroke({ color: '#efb83e', width: 5 }));
    this.hintText = text(this, 'Tap a box to place\ninto the slot.', 540, 1010, 46, '#705024');
    this.hintText.style.align = 'center';
    this.hintText.style.fontWeight = '800';
    this.hand = text(this, '👆', 0, 0, 86);
    this.hand.style.fontFamily = 'Segoe UI Emoji, Apple Color Emoji, sans-serif';
    this.hand.rotation = -0.35;
  }
  placed() { this.dismissed = true; this.visible = false; }
  update(model: GameModel, delta: number) {
    this.pulse += delta;
    this.visible = model.level.id === 1 && model.state === 'Playing'
      && !this.dismissed;
    if (!this.visible) return;
    this.highlight.clear();
    const lane = model.dockModel.lanes.findIndex(items => items[0] && model.board.canClaim(items[0].color));
    if (lane < 0 || model.dockModel.full) {
      this.visible = false;
      return;
    }
    const x = (Config.designWidth - (model.level.lanes.length - 1) * Config.layout.laneSpacing) / 2
      + lane * Config.layout.laneSpacing;
    const y = Config.layout.laneY - 35;
    const margin = 5 + Math.sin(this.pulse / 200) * 3;
    const left = x - 64;
    const top = y - 64;
    this.shade.clear()
      .rect(0, 0, Config.designWidth, top)
      .rect(0, top, left, 140)
      .rect(x + 64, top, Config.designWidth - x - 64, 140)
      .rect(0, top + 140, Config.designWidth, Config.designHeight - top - 140)
      .fill({ color: '#34291d', alpha: 0.45 });
    this.highlight.roundRect(x - 56 - margin, y - 56 - margin, 112 + margin * 2, 122 + margin * 2, 18)
      .stroke({ color: '#ffcf35', width: 6 });
    this.hand.position.set(x + 38, y + 70 + Math.sin(this.pulse / 250) * 7);
  }
}
