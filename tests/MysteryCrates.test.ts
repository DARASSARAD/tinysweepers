import { describe, expect, it } from 'vitest';
import { DockModel } from '../src/logic/DockModel';

describe('mystery crates', () => {
  it('reveals only the next crate after a successful selection and preserves level data', () => {
    const lane = [{ color: 0, capacity: 2 }, { color: 1, capacity: 3, hidden: true }, { color: 2, capacity: 4, hidden: true }];
    const docks = new DockModel([lane], 1);
    expect(docks.place(0)).toBe(0);
    expect(docks.peek(0)).toMatchObject({ color: 1, hidden: false });
    expect(docks.lanes[0][1].hidden).toBe(true);
    expect(docks.place(0)).toBeNull();
    expect(docks.lanes[0][1].hidden).toBe(true);
    expect(lane[1].hidden).toBe(true);
    docks.docks[0]!.atDock = 0;
    docks.free(0);
    docks.place(0);
    expect(docks.peek(0)).toMatchObject({ color: 2, hidden: false });
  });
  it('shows the initial top crate even if its data is marked hidden', () => {
    const docks = new DockModel([[{ color: 1, capacity: 2, hidden: true }]], 5);
    expect(docks.peek(0)?.hidden).toBe(false);
  });
});
