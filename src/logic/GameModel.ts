import { Config } from '../core/Config';
import { Events } from '../core/Events';
import { BoardModel } from './BoardModel';
import { DockModel } from './DockModel';
import { validate, type LevelData } from './LevelData';

export type GameState = 'Playing' | 'Won' | 'Lost';
export type BotPhase = 'outbound' | 'pickup' | 'inbound' | 'return';
export interface BotTask {
  id: number;
  crateId: number;
  color: number;
  dock: number;
  cell: number;
  phase: BotPhase;
  elapsed: number;
  delay: number;
}
export type GameEvent = { type: 'placed'; dock: number } | { type: 'delivered'; cell: number; color: number }
  | { type: 'state'; state: GameState };

export class GameModel {
  readonly board: BoardModel;
  readonly dockModel: DockModel;
  readonly bots = new Map<number, BotTask>();
  readonly events = new Events<GameEvent>();
  state: GameState = 'Playing';
  private nextBotId = 0;

  constructor(readonly level: LevelData, exposureRequired: boolean = Config.exposureRequired) {
    validate(level);
    this.board = new BoardModel(level, exposureRequired);
    this.dockModel = new DockModel(level.lanes, level.dockCount);
    // Idle crates wake only when a delivery changes exposure, or on placement.
    this.board.exposureChanged.on(() => this.dispatch());
  }

  placeCrate(lane: number): boolean {
    if (this.state !== 'Playing') return false;
    const dock = this.dockModel.place(lane);
    if (dock === null) return false;
    this.events.emit({ type: 'placed', dock });
    this.dispatch();
    this.checkState();
    return true;
  }

  private dispatch() {
    this.dockModel.docks.forEach((crate, dock) => {
      if (!crate) return;
      let stagger = 0;
      while (crate.unassigned > 0) {
        const id = this.nextBotId;
        const cell = this.board.tryClaim(crate.color, id);
        if (cell === null) break;
        this.nextBotId++;
        crate.unassigned--;
        this.bots.set(id, { id, crateId: crate.id, color: crate.color, dock, cell, phase: 'outbound', elapsed: 0,
          delay: stagger++ * Config.motion.staggerMs });
      }
    });
  }

  duration(phase: BotPhase): number {
    return Config.motion[`${phase}Ms`];
  }

  update(deltaMs: number) {
    if (this.state === 'Lost') return;
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) return;
    for (const bot of [...this.bots.values()]) {
      let budget = deltaMs;
      if (bot.delay > 0) {
        const spent = Math.min(budget, bot.delay);
        bot.delay -= spent;
        budget -= spent;
      }
      while (budget > 0 && this.bots.has(bot.id)) {
        const spent = Math.min(budget, this.duration(bot.phase) - bot.elapsed);
        bot.elapsed += spent;
        budget -= spent;
        if (bot.elapsed < this.duration(bot.phase)) break;
        bot.elapsed = 0;
        if (bot.phase === 'outbound') bot.phase = 'pickup';
        else if (bot.phase === 'pickup') bot.phase = 'inbound';
        else if (bot.phase === 'inbound') {
          bot.phase = 'return';
          const crate = this.dockModel.docks[bot.dock];
          if (!crate || crate.id !== bot.crateId) throw new Error('Bot lost its docked crate');
          crate.undelivered--;
          if (!this.board.remove(bot.cell, bot.id)) throw new Error('Bot lost its cube reservation');
          this.events.emit({ type: 'delivered', cell: bot.cell, color: bot.color });
          this.dockModel.free(bot.dock);
        } else this.bots.delete(bot.id);
      }
    }
    this.checkState();
  }

  private checkState() {
    if (this.state !== 'Playing') return;
    if (this.board.remaining === 0) this.state = 'Won';
    else if (this.dockModel.full && this.bots.size === 0
      && !this.dockModel.docks.some(crate => crate && crate.unassigned > 0 && this.board.canClaim(crate.color))) {
      this.state = 'Lost';
    }
    if (this.state !== 'Playing') this.events.emit({ type: 'state', state: this.state });
  }
}
