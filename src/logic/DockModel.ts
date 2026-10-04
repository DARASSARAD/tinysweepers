import type { CrateData } from './LevelData';

export interface DockedCrate extends CrateData {
  id: number;
  unassigned: number;
  undelivered: number;
  atDock: number;
}

export class DockModel {
  readonly lanes: CrateData[][];
  readonly docks: (DockedCrate | null)[];
  private nextCrateId = 0;
  lastPlaced: { lane: number; dock: number }[] = [];
  readonly bonusSides = new Map<number, 'left' | 'right'>();
  readonly baseCount: number;

  constructor(lanes: CrateData[][], count: number) {
    this.baseCount = count;
    this.lanes = lanes.map(lane => lane.map(crate => ({ ...crate })));
    this.lanes.forEach(lane => { if (lane[0]) lane[0].hidden = false; });
    this.docks = Array.from({ length: count }, () => null);
  }

  get full() { return this.docks.every(crate => crate !== null); }
  unlockBonus(side: 'left' | 'right') {
    if ([...this.bonusSides.values()].includes(side)) return false;
    this.bonusSides.set(this.docks.length, side);
    this.docks.push(null);
    return true;
  }
  peek(lane: number) { return this.lanes[lane]?.[0] ?? null; }
  placementLanes(lane: number): number[] {
    const crate = this.peek(lane);
    if (!crate) return [];
    if (!crate.pairId) return [lane];
    const partner = this.lanes.findIndex((items, column) => column !== lane && items[0]?.pairId === crate.pairId);
    return partner < 0 ? [] : [lane, partner].sort((a, b) => a - b);
  }
  canPlace(lane: number) {
    const columns = this.placementLanes(lane);
    if (!columns.length || this.docks.filter(crate => !crate).length < columns.length) return false;
    if (columns.length === 1) return true;
    const base = this.docks.slice(0, this.baseCount);
    const free = base.filter(crate => !crate).length;
    const movable = base.filter(crate => crate && (!crate.pairId
      || !this.docks.some(other => other && other.id !== crate.id && other.pairId === crate.pairId))).length;
    const bonusFree = this.docks.slice(this.baseCount).filter(crate => !crate).length;
    return free + Math.min(movable, bonusFree) >= 2;
  }

  place(lane: number, depth = 0): number | null {
    this.lastPlaced = [];
    if (depth !== 0 || !this.canPlace(lane)) return null;
    const columns = this.placementLanes(lane);
    let dock = this.docks.indexOf(null);
    if (columns.length === 2) {
      while (this.docks.slice(0, this.baseCount).filter(crate => !crate).length < 2) {
        const movable = this.docks.findIndex((crate, i) => i < this.baseCount && crate && (!crate.pairId
          || !this.docks.some(other => other && other.id !== crate.id && other.pairId === crate.pairId)));
        const bonus = this.docks.findIndex((crate, i) => i >= this.baseCount && !crate);
        this.docks[bonus] = this.docks[movable];
        this.docks[movable] = null;
      }
      dock = this.docks.findIndex((crate, i) => !crate && i + 1 < this.baseCount && !this.docks[i + 1]);
      if (dock < 0) {
        // Keep occupied crates in their relative order, moving them right to
        // create adjacent empty docks without splitting existing pairs.
        const occupied = this.docks.slice(0, this.baseCount).filter((crate): crate is DockedCrate => crate !== null);
        this.docks.fill(null, 0, this.baseCount);
        occupied.forEach((crate, i) => { this.docks[this.baseCount - occupied.length + i] = crate; });
        dock = 0;
      }
    }
    columns.forEach((column, offset) => {
      const crate = this.lanes[column].shift()!;
      crate.hidden = false;
      const next = this.peek(column);
      if (next) next.hidden = false;
      const slot = dock + offset;
      this.docks[slot] = { ...crate, id: this.nextCrateId++, unassigned: crate.capacity, undelivered: crate.capacity, atDock: crate.capacity };
      this.lastPlaced.push({ lane: column, dock: slot });
    });
    return dock;
  }

  placeBuried(lane: number, depth: number): number | null {
    this.lastPlaced = [];
    if (depth <= 0 || !this.lanes[lane]?.[depth]) return null;
    const dock = this.docks.indexOf(null);
    if (dock < 0) return null;
    const [crate] = this.lanes[lane].splice(depth, 1);
    crate.hidden = false;
    this.docks[dock] = { ...crate, id: this.nextCrateId++, unassigned: crate.capacity,
      undelivered: crate.capacity, atDock: crate.capacity };
    this.lastPlaced.push({ lane, dock });
    return dock;
  }

  free(dock: number): boolean {
    const crate = this.docks[dock];
    if (!crate || crate.atDock !== 0) return false;
    const partner = crate.pairId ? this.docks.findIndex(other => other
      && other.id !== crate.id && other.pairId === crate.pairId) : -1;
    if (partner >= 0) {
      if (this.docks[partner]!.atDock !== 0) return false;
      this.docks[partner] = null;
    }
    this.docks[dock] = null;
    return true;
  }
}
