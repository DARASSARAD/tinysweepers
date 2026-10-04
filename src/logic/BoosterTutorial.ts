import type { LevelData } from './LevelData';

export function boosterTutorialLevel(level: LevelData): LevelData {
  const lanes = level.lanes.map(lane => lane.map(crate => ({ ...crate })));
  // Split an existing shipment so the extra practice crate preserves cube totals.
  const lane = lanes.find(items => items[0]?.capacity > 1 && !items[0].pairId);
  if (lane) {
    lane[0].capacity--;
    lane.splice(1, 0, { color: lane[0].color, capacity: 1 });
  }
  // Bring an existing orange shipment to the front of every tutorial lane.
  // Level 5's orange color role stays at index 2 when its palette changes.
  const orange = 2;
  for (const items of lanes) {
    const index = items.findIndex(crate => crate.color === orange && !crate.pairId);
    if (index >= 0) {
      const [crate] = items.splice(index, 1);
      crate.hidden = false;
      items.unshift(crate);
    }
  }
  return { ...level, lanes };
}
