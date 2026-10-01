import { Container, Sprite } from 'pixi.js';
import { Config } from '../core/Config';
import type { BotTask, GameModel } from '../logic/GameModel';
import type { GameAtlas } from './Atlas';
import type { BoardView } from './BoardView';

export class BotView extends Container {
  private readonly body: Sprite;
  private readonly cargo: Sprite;
  constructor(atlas: GameAtlas) {
    super();
    this.body = new Sprite(atlas.bot);
    this.body.anchor.set(0.5);
    this.body.width = this.body.height = 60;
    this.cargo = new Sprite(atlas.cube);
    this.cargo.anchor.set(0.5);
    this.cargo.width = this.cargo.height = 28;
    this.cargo.position.set(0, -34);
    this.addChild(this.body, this.cargo);
  }

  sync(bot: BotTask, model: GameModel, board: BoardView) {
    const dock = { x: (Config.designWidth - (model.level.dockCount - 1) * Config.layout.dockSpacing) / 2
      + bot.dock * Config.layout.dockSpacing, y: Config.layout.dockY };
    const cell = board.cellPosition(bot.cell);
    const target = { x: cell.x + board.x, y: cell.y + board.y };
    const bin = { x: Config.layout.binX, y: Config.layout.binY };
    const progress = Math.min(1, bot.elapsed / model.duration(bot.phase));
    const ease = progress * progress * (3 - 2 * progress);
    const from = bot.phase === 'outbound' ? dock : bot.phase === 'return' ? bin : target;
    const to = bot.phase === 'outbound' || bot.phase === 'pickup' ? target : bot.phase === 'inbound' ? bin : dock;
    this.position.set(from.x + (to.x - from.x) * ease, from.y + (to.y - from.y) * ease);
    this.body.tint = model.level.palette[bot.color];
    this.cargo.tint = model.level.palette[bot.color];
    this.cargo.visible = bot.phase === 'inbound';
    this.visible = bot.delay <= 0;
    this.body.rotation = bot.phase === 'pickup' ? Math.sin(progress * Math.PI * 4) * 0.16 : 0;
    this.alpha = bot.phase === 'return' ? 1 - progress * 0.5 : 1;
  }
}
