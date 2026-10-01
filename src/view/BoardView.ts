import { Container, Graphics, Sprite } from 'pixi.js';
import { Config } from '../core/Config';
import type { GameModel } from '../logic/GameModel';
import type { GameAtlas } from './Atlas';
import { colorMark } from './Elements';

export class BoardView extends Container {
  private readonly cubes = new Map<number, Sprite>();
  private readonly marks = new Map<number, Graphics>();
  private readonly debug = new Graphics();
  readonly cellSize: number;

  constructor(private readonly model: GameModel, atlas: GameAtlas, symbols: boolean) {
    super();
    const { boardX, boardY, boardSize } = Config.layout;
    this.position.set(boardX, boardY);
    this.cellSize = boardSize / Math.max(model.level.width, model.level.height);
    this.addChild(new Graphics().roundRect(-22, -22, boardSize + 44, boardSize + 44, 44).fill('#d8d0be')
      .roundRect(-16, -20, boardSize + 32, boardSize + 32, 40).fill('#f9f6ed'));
    model.level.pixels.forEach((color, index) => {
      const { x, y } = this.cellPosition(index);
      // The permanent floor mosaic appears as dust is lifted.
      const tile = new Graphics().roundRect(x - this.cellSize / 2 + 3, y - this.cellSize / 2 + 3, this.cellSize - 6, this.cellSize - 6, 12)
        .fill(color < 0 ? '#f0e9db' : model.level.palette[color]);
      tile.alpha = 0.35;
      this.addChild(tile);
      if (color < 0) return;
      const cube = new Sprite(atlas.cube);
      cube.anchor.set(0.5);
      cube.position.set(x, y);
      cube.width = this.cellSize - 8;
      cube.height = this.cellSize - 8;
      cube.tint = model.level.palette[color];
      this.addChild(cube);
      this.cubes.set(index, cube);
      const mark = colorMark(this, color, x, y - 3, this.cellSize * 0.22);
      mark.visible = symbols;
      this.marks.set(index, mark);
    });
    this.addChild(this.debug);
  }

  cellPosition(index: number) {
    return { x: (index % this.model.level.width + 0.5) * this.cellSize,
      y: (Math.floor(index / this.model.level.width) + 0.5) * this.cellSize };
  }

  sync(symbols: boolean) {
    const lifted = new Set([...this.model.bots.values()].filter(bot => bot.phase === 'inbound' || bot.phase === 'return').map(bot => bot.cell));
    for (const [index, cube] of this.cubes) {
      cube.visible = this.model.board.cells[index] >= 0 && !lifted.has(index);
      cube.alpha = this.model.board.reservations.has(index) ? 0.8 : 1;
      this.marks.get(index)!.visible = symbols && cube.visible;
    }
    this.debug.clear();
    if (Config.debugExposure) {
      for (const index of this.model.board.exposed) {
        const { x, y } = this.cellPosition(index);
        this.debug.rect(x - this.cellSize / 2, y - this.cellSize / 2, this.cellSize, this.cellSize)
          .stroke({ color: '#314c49', width: 4 });
      }
    }
  }
}
