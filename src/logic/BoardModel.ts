import { Events } from '../core/Events';
import type { LevelData } from './LevelData';

export class BoardModel {
  readonly cells: number[];
  readonly mysteryCells: Set<number>;
  readonly exposed = new Set<number>();
  readonly reservations = new Map<number, number>();
  readonly exposureChanged = new Events<number>();
  private count: number;
  private readonly reachable = new Set<number>();

  constructor(readonly level: LevelData, private readonly exposureRequired = true) {
    this.cells = [...level.pixels];
    this.mysteryCells = new Set(level.mysteryCells ?? []);
    this.count = this.cells.filter(color => color >= 0).length;
    this.cells.forEach((color, index) => {
      if (color >= 0 && this.isExposed(index)) this.exposed.add(index);
    });
    this.refreshReachable();
  }

  private refreshReachable() {
    this.reachable.clear();
    const visited = new Set<number>();
    const queue: number[] = [];
    const visit = (index: number) => {
      if (this.cells[index] >= 0) { this.reachable.add(index); return; }
      if (!visited.has(index)) { visited.add(index); queue.push(index); }
    };
    const { width, height } = this.level;
    for (let x = 0; x < width; x++) { visit(x); visit((height - 1) * width + x); }
    for (let y = 0; y < height; y++) { visit(y * width); visit(y * width + width - 1); }
    for (let head = 0; head < queue.length; head++) this.neighbors(queue[head]).forEach(visit);
  }

  get remaining() { return this.count; }

  private neighbors(index: number): number[] {
    const { width, height } = this.level;
    const x = index % width;
    const y = Math.floor(index / width);
    const result: number[] = [];
    if (x > 0) result.push(index - 1);
    if (x < width - 1) result.push(index + 1);
    if (y > 0) result.push(index - width);
    if (y < height - 1) result.push(index + width);
    return result;
  }

  isExposed(index: number): boolean {
    if (!Number.isInteger(index) || index < 0 || index >= this.cells.length || this.cells[index] < 0) return false;
    if (!this.exposureRequired) return true;
    const x = index % this.level.width;
    const y = Math.floor(index / this.level.width);
    return x === 0 || y === 0 || x === this.level.width - 1 || y === this.level.height - 1
      || this.neighbors(index).some(neighbor => this.cells[neighbor] < 0);
  }

  canClaim(color: number): boolean {
    for (const index of this.exposed) {
      if (this.cells[index] === color && !this.mysteryCells.has(index) && !this.reservations.has(index)
        && (!this.exposureRequired || this.reachable.has(index))) return true;
    }
    return false;
  }

  tryClaim(color: number, botId: number): number | null {
    // A bot may own one reservation only, even if called twice.
    if ([...this.reservations.values()].includes(botId)) return null;
    let target: number | null = null;
    for (const index of this.exposed) {
      if (this.cells[index] === color && !this.mysteryCells.has(index) && !this.reservations.has(index)
        && (!this.exposureRequired || this.reachable.has(index))) {
        const row = Math.floor(index / this.level.width);
        const targetRow = target === null ? -1 : Math.floor(target / this.level.width);
        // Start nearest the docks, then work left-to-right within each row.
        // Compare coordinates instead of relying on exposure-set insertion order.
        if (row > targetRow || (row === targetRow && target !== null && index < target)) target = index;
      }
    }
    if (target !== null) this.reservations.set(target, botId);
    return target;
  }

  remove(index: number, botId: number): boolean {
    if (this.reservations.get(index) !== botId || this.cells[index] < 0) return false;
    this.cells[index] = -1;
    this.reservations.delete(index);
    this.exposed.delete(index);
    this.count--;
    // Only immediate neighbors can become exposed when this cell disappears.
    for (const neighbor of this.neighbors(index)) {
      this.mysteryCells.delete(neighbor);
      if (this.cells[neighbor] >= 0) this.exposed.add(neighbor);
    }
    this.refreshReachable();
    this.exposureChanged.emit(index);
    return true;
  }
}
