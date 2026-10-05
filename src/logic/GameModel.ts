import { Config } from '../core/Config';
import { robotRouteDuration } from '../core/RobotPath';
import { botRoutes } from './BotRoutes';
import { dockPosition } from '../core/DockLayout';
import { Events } from '../core/Events';
import { BoardModel } from './BoardModel';
import { DockModel, type DockedCrate } from './DockModel';
import { validate, type LevelData } from './LevelData';

export type GameState = 'Playing' | 'Won' | 'Lost';
export type BotPhase = 'outbound' | 'pickup' | 'inbound';
export interface BotTask {
  id: number;
  crateId: number;
  color: number;
  dock: number;
  cell: number;
  phase: BotPhase;
  elapsed: number;
  delay: number;
  routes: ReturnType<typeof botRoutes>;
  travelMs: { outbound: number; inbound: number };
}
export type GameEvent = { type: 'placed'; dock: number; placements: { lane: number; dock: number }[] } | { type: 'delivered'; cell: number; color: number }
  | { type: 'collected'; cell: number; color: number }
  | { type: 'state'; state: GameState };

export class GameModel {
  readonly board: BoardModel;
  readonly dockModel: DockModel;
  readonly bots = new Map<number, BotTask>();
  readonly events = new Events<GameEvent>();
  state: GameState = 'Playing';
  private nextBotId = 0;
  private readonly activeCrates = new Map<number, DockedCrate>();

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
    this.activatePlacedCrates(dock);
    return true;
  }

  shuffleCrates(random: () => number = Math.random): boolean {
    if (this.state !== 'Playing') return false;
    const lanes = this.dockModel.lanes;
    const free = this.dockModel.docks.filter(crate => !crate).length;
    const candidates = lanes.flatMap((lane, column) => lane.map((crate, depth) => ({ crate, column, depth })))
      .filter(({ crate }) => this.board.canClaim(crate.color) && (crate.pairId
        ? this.dockModel.docks.slice(0, this.dockModel.baseCount).filter(item => !item).length >= 2
          && lanes.flat().filter(item => item.pairId === crate.pairId).length === 2
        : free >= 1));
    if (!candidates.length) return false;
    const selected = candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))];
    // Shuffle single crates in their existing slots; preserve connected-pair ordering.
    for (const lane of lanes) {
      const singles = lane.filter(crate => !crate.pairId);
      for (let i = singles.length - 1; i > 0; i--) {
        const j = Math.min(i, Math.floor(random() * (i + 1)));
        [singles[i], singles[j]] = [singles[j], singles[i]];
      }
      let next = 0;
      lane.forEach((crate, index) => { if (!crate.pairId) lane[index] = singles[next++]; });
    }
    for (const lane of lanes) {
      const index = lane.findIndex(crate => crate === selected.crate
        || !!selected.crate.pairId && crate.pairId === selected.crate.pairId);
      if (index >= 0) lane.unshift(...lane.splice(index, 1));
      if (lane[0]) lane[0].hidden = false;
    }
    return true;
  }

  vacuumColor(cell: number): boolean {
    if (this.state !== 'Playing' || !Number.isInteger(cell) || (this.board.cells[cell] ?? -1) < 0) return false;
    const color = this.board.cells[cell];
    const brokenPairs = new Set<string>();
    const allCrates = [...this.dockModel.lanes.flat(), ...this.activeCrates.values(),
      ...this.dockModel.docks.filter((crate): crate is DockedCrate => !!crate)];
    for (const crate of allCrates) if (crate.color === color && crate.pairId) brokenPairs.add(crate.pairId);
    for (const crate of allCrates) if (crate.pairId && brokenPairs.has(crate.pairId)) delete crate.pairId;
    for (const lane of this.dockModel.lanes) {
      for (let i = lane.length - 1; i >= 0; i--) if (lane[i].color === color) lane.splice(i, 1);
      if (lane[0]) lane[0].hidden = false;
    }
    this.dockModel.docks.forEach((crate, dock) => { if (crate?.color === color) this.dockModel.docks[dock] = null; });
    for (const [id, crate] of this.activeCrates) if (crate.color === color) this.activeCrates.delete(id);
    for (const [id, bot] of this.bots) if (bot.color === color) this.bots.delete(id);
    this.board.removeColor(color);
    this.dispatch();
    this.checkState();
    return true;
  }

  placeBuriedCrate(lane: number, depth: number): boolean {
    if (this.state !== 'Playing') return false;
    const dock = this.dockModel.placeBuried(lane, depth);
    if (dock === null) return false;
    this.activatePlacedCrates(dock);
    return true;
  }

  private activatePlacedCrates(dock: number) {
    for (const bot of this.bots.values()) {
      if (bot.phase !== 'outbound' || bot.elapsed !== 0) continue;
      const slot = this.dockModel.docks.findIndex(crate => crate?.id === bot.crateId);
      if (slot < 0 || slot === bot.dock) continue;
      bot.dock = slot;
      const start = bot.routes.outbound[0];
      const exit = bot.routes.outbound[1];
      const position = dockPosition(this.level.dockCount, slot, this.dockModel.bonusSides.get(slot));
      start.x = position.x;
      start.y = position.y;
      if (exit) { exit.x = position.x; exit.y = position.y - Config.layout.dockExitDistance; }
      if (bot.routes.outbound[2]) bot.routes.outbound[2].y = position.y - Config.layout.dockExitDistance;
      bot.travelMs.outbound = robotRouteDuration(bot.routes.outbound, Config.motion.botSpeed);
    }
    for (const placement of this.dockModel.lastPlaced) {
      const crate = this.dockModel.docks[placement.dock]!;
      this.activeCrates.set(crate.id, crate);
    }
    this.events.emit({ type: 'placed', dock, placements: this.dockModel.lastPlaced });
    this.dispatch();
    this.checkState();
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
        const routes = botRoutes(this.level, this.board.cells, cell, dock, this.dockModel.bonusSides.get(dock));
        const travelMs = {
          outbound: robotRouteDuration(routes.outbound, Config.motion.botSpeed),
          inbound: robotRouteDuration(routes.inbound, Config.motion.botSpeed),
        };
        this.bots.set(id, { id, crateId: crate.id, color: crate.color, dock, cell, phase: 'outbound', elapsed: 0,
          delay: stagger++ * Config.motion.staggerMs, routes, travelMs });
      }
    });
  }

  duration(bot: BotTask): number {
    return bot.phase === 'pickup' ? Config.motion.pickupMs : bot.travelMs[bot.phase];
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
        if (bot.phase === 'outbound' && bot.elapsed === 0) {
          const crate = this.dockModel.docks[bot.dock];
          if (!crate || crate.id !== bot.crateId) throw new Error('Bot lost its docked crate');
          crate.atDock--;
          this.dockModel.free(bot.dock);
        }
        const spent = Math.min(budget, this.duration(bot) - bot.elapsed);
        bot.elapsed += spent;
        budget -= spent;
        // Route lengths produce fractional milliseconds; tolerate arithmetic rounding at arrival.
        if (this.duration(bot) - bot.elapsed > 1e-7) break;
        bot.elapsed = 0;
        if (bot.phase === 'outbound') bot.phase = 'pickup';
        else if (bot.phase === 'pickup') {
          bot.phase = 'inbound';
          this.events.emit({ type: 'collected', cell: bot.cell, color: bot.color });
        }
        else if (bot.phase === 'inbound') {
          this.bots.delete(bot.id);
          const crate = this.activeCrates.get(bot.crateId);
          if (!crate) throw new Error('Bot lost its crate');
          crate.undelivered--;
          if (!this.board.remove(bot.cell, bot.id)) throw new Error('Bot lost its cube reservation');
          this.events.emit({ type: 'delivered', cell: bot.cell, color: bot.color });
          if (crate.undelivered === 0) this.activeCrates.delete(crate.id);
        }
      }
    }
    this.checkState();
  }

  private checkState() {
    if (this.state !== 'Playing') return;
    if (this.board.remaining === 0) this.state = 'Won';
    else if (this.bots.size === 0 && !this.dockModel.lanes.some((_, lane) => this.dockModel.canPlace(lane))
      && !this.dockModel.docks.some(crate => crate && crate.unassigned > 0 && this.board.canClaim(crate.color))) {
      this.state = 'Lost';
    }
    if (this.state !== 'Playing') this.events.emit({ type: 'state', state: this.state });
  }
}
