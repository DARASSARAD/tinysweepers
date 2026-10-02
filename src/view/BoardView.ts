import { Container, Graphics } from 'pixi.js';
import { Config } from '../core/Config';
import type { GameModel } from '../logic/GameModel';
import { colorMark } from './Elements';

export class BoardView extends Container {
  private readonly cubes = new Map<number, Graphics>();
  private readonly marks = new Map<number, Graphics>();
  private readonly debug = new Graphics();
  private readonly shine = new Graphics();
  private shineElapsed = 0;
  readonly cellSize: number;
  readonly blockSize: number;

  constructor(private readonly model: GameModel, symbols: boolean) {
    super();
    const { boardX, boardY, boardSize } = Config.layout;
    this.position.set(boardX, boardY);
    this.cellSize = boardSize / Math.max(model.level.width, model.level.height);
    const cubeGap = Math.min(model.level.blockGap ?? Config.layout.cubeGap, this.cellSize * Config.layout.cellGapRatio);
    this.blockSize = this.cellSize - cubeGap;
    this.addChild(new Graphics().roundRect(-22, -22, boardSize + 44, boardSize + 44, 44).fill('#d8d0be')
      .roundRect(-16, -20, boardSize + 32, boardSize + 32, 40).fill('#dfd0c6'));
    model.level.pixels.forEach((color, index) => {
      if (color < 0) return;
      const { x, y } = this.cellPosition(index);
      const size = this.blockSize;
      const half = size / 2;
      const depth = Math.max(0.75, Math.min(2.5, size * 0.07));
      const radius = Math.min(10, size * 0.14);
      const cubeColor = model.level.palette[color];
      const cube = new Graphics()
        // Drop shadow and lower lip create the raised block silhouette.
        .roundRect(-half + depth, -half + depth, size, size, radius)
        .fill({ color: '#26342f', alpha: 0.24 })
        .roundRect(-half, -half, size, size, radius)
        .fill(cubeColor)
        // Light catches the upper and left bevels.
        .moveTo(-half + radius, -half + depth / 2)
        .lineTo(half - radius, -half + depth / 2)
        .stroke({ color: '#ffffff', alpha: 0.62, width: depth })
        .moveTo(-half + depth / 2, -half + radius)
        .lineTo(-half + depth / 2, half - radius)
        .stroke({ color: '#ffffff', alpha: 0.38, width: depth })
        // A shaded lower edge makes the depth visible at small cell sizes.
        .moveTo(-half + radius, half - depth / 2)
        .lineTo(half - radius, half - depth / 2)
        .stroke({ color: '#26342f', alpha: 0.3, width: depth })
        .moveTo(half - depth / 2, -half + radius)
        .lineTo(half - depth / 2, half - radius)
        .stroke({ color: '#26342f', alpha: 0.22, width: depth });
      cube.position.set(x, y);
      this.addChild(cube);
      this.cubes.set(index, cube);
      const mark = colorMark(this, color, x, y - 3, this.cellSize * 0.22);
      mark.visible = symbols;
      this.marks.set(index, mark);
    });
    this.addChild(this.debug, this.shine);
  }

  cellPosition(index: number) {
    return this.gridPosition(index % this.model.level.width, Math.floor(index / this.model.level.width));
  }

  gridPosition(column: number, row: number) {
    const offsetX = (Config.layout.boardSize - this.model.level.width * this.cellSize) / 2;
    const offsetY = (Config.layout.boardSize - this.model.level.height * this.cellSize) / 2;
    const rawX = offsetX + (column + 0.5) * this.cellSize;
    const rawY = offsetY + (row + 0.5) * this.cellSize;
    const center = Config.layout.boardSize / 2;
    return {
      x: rawX + (center - rawY) * Config.projection.shearX,
      y: center + (rawY - center) * Config.projection.scaleY,
    };
  }

  sync(symbols: boolean) {
    const lifted = new Set([...this.model.bots.values()].filter(bot => bot.phase === 'inbound').map(bot => bot.cell));
    for (const [index, cube] of this.cubes) {
      cube.visible = this.model.board.cells[index] >= 0 && !lifted.has(index);
      cube.alpha = 1;
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

  update(delta: number) {
    this.shine.clear();
    if (this.model.state !== 'Won') return;
    this.shineElapsed += delta;
    const progress = Math.min(1, this.shineElapsed / Config.effects.shineMs);
    const x = progress * (Config.layout.boardSize + 120) - 60;
    const left = Math.max(0, x - 60);
    const right = Math.min(Config.layout.boardSize, x + 60);
    if (right > left) this.shine.rect(left, 0, right - left, Config.layout.boardSize)
      .fill({ color: '#ffffff', alpha: 0.5 * (1 - progress) });
  }
}
