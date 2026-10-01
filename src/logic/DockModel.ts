import type { CrateData } from './LevelData';

export interface DockedCrate extends CrateData {
  id: number;
  unassigned: number;
  undelivered: number;
}

export class DockModel {
  readonly lanes: CrateData[][];
  readonly docks: (DockedCrate | null)[];
  private nextCrateId = 0;

  constructor(lanes: CrateData[][], count: number) {
    this.lanes = lanes.map(lane => lane.map(crate => ({ ...crate })));
    this.docks = Array.from({ length: count }, () => null);
  }

  get full() { return this.docks.every(crate => crate !== null); }
  peek(lane: number) { return this.lanes[lane]?.[0] ?? null; }

  place(lane: number, depth = 0): number | null {
    if (depth !== 0 || !this.peek(lane)) return null;
    const dock = this.docks.indexOf(null);
    if (dock < 0) return null;
    const crate = this.lanes[lane].shift()!;
    this.docks[dock] = { ...crate, id: this.nextCrateId++, unassigned: crate.capacity, undelivered: crate.capacity };
    return dock;
  }

  free(dock: number): boolean {
    const crate = this.docks[dock];
    if (!crate || crate.undelivered !== 0) return false;
    this.docks[dock] = null;
    return true;
  }
}
