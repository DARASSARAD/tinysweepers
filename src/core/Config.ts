export const Config = {
  designWidth: 1080,
  designHeight: 1920,
  maxResolution: 2,
  minTapTarget: 44,
  dockCount: 5,
  exposureRequired: true,
  debugExposure: false,
  motion: { outboundMs: 650, pickupMs: 180, inboundMs: 650, returnMs: 400, staggerMs: 85, maxFrameMs: 50 },
  layout: { floorTile: 96, boardX: 140, boardY: 340, boardSize: 800, dockY: 1320, laneY: 1570, laneSpacing: 195, dockSpacing: 184, binX: 540, binY: 1190 },
  effects: { puffMs: 420, puffCount: 6, volume: 0.07 },
  progressKey: 'tiny-sweepers-progress-v1',
  settingsKey: 'tiny-sweepers-settings-v1',
} as const;
