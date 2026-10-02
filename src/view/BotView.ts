import { Container, Graphics, Sprite } from 'pixi.js';
import { Config } from '../core/Config';
import { robotRouteMotion } from '../core/RobotPath';
import type { BotTask, GameModel } from '../logic/GameModel';
import type { GameAtlas } from './Atlas';
import type { BoardView } from './BoardView';

export class BotView extends Container {
  private readonly body: Sprite;
  private readonly face: Sprite;
  private readonly details: Sprite;
  private readonly cargo: Sprite;
  constructor(atlas: GameAtlas) {
    super();
    this.body = new Sprite(atlas.bot);
    this.body.anchor.set(0.5);
    this.body.width = this.body.height = Config.layout.botSize;
    this.face = new Sprite(atlas.botFace);
    this.face.anchor.set(0.5);
    this.details = new Sprite(atlas.botDetails);
    this.details.anchor.set(0.5);
    this.cargo = new Sprite(atlas.cube);
    this.cargo.anchor.set(0.5);
    this.cargo.width = this.cargo.height = Config.layout.cargoSize;
    this.cargo.position.set(0, -34);
    const shadow = new Graphics().ellipse(2, 7, Config.layout.botSize * 0.43, Config.layout.botSize * 0.36)
      .fill({ color: '#352b29', alpha: 0.2 });
    this.addChild(shadow, this.body, this.face, this.details, this.cargo);
  }

  sync(bot: BotTask, model: GameModel, board: BoardView) {
    const size = Config.layout.botSize;
    this.body.width = this.body.height = size;
    this.face.width = this.face.height = size;
    this.details.width = this.details.height = size;
    this.cargo.width = this.cargo.height = board.blockSize;
    const cell = board.cellPosition(bot.cell);
    const target = { x: cell.x + board.x, y: cell.y + board.y };
    const progress = Math.min(1, bot.elapsed / model.duration(bot));
    const { outbound, inbound } = bot.routes;
    const outboundHeading = robotRouteMotion(outbound, 1, 0).heading;
    const position = robotRouteMotion(bot.phase === 'outbound' ? outbound : bot.phase === 'inbound' ? inbound : [target],
      progress, bot.phase === 'outbound' ? 0 : outboundHeading);
    this.position.set(position.x, position.y);
    const crateColor = model.level.palette[bot.color];
    const color = Number.parseInt(crateColor.replace('#', ''), 16);
    const darken = (channel: number) => Math.round(channel * 0.62);
    this.body.tint = (darken((color >> 16) & 255) << 16) | (darken((color >> 8) & 255) << 8) | darken(color & 255);
    this.face.tint = crateColor;
    this.cargo.tint = crateColor;
    this.cargo.visible = bot.phase === 'inbound';
    this.visible = bot.delay <= 0;
    this.body.rotation = position.heading;
    this.face.rotation = position.heading;
    this.details.rotation = position.heading;
    this.cargo.rotation = position.heading;
    this.cargo.position.set(Math.sin(position.heading) * size * 0.56,
      -Math.cos(position.heading) * size * 0.56);
    this.alpha = 1;
  }
}
