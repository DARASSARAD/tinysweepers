import { describe, expect, it } from 'vitest';
import { Config } from '../src/core/Config';

describe('orthographic board projection', () => {
  it('keeps columns straight while compressing depth', () => {
    const center = Config.layout.boardSize / 2;
    const project = (x: number, y: number) => ({
      x: x + (center - y) * Config.projection.shearX,
      y: center + (y - center) * Config.projection.scaleY,
    });
    expect(project(center, 0).x).toBe(center);
    expect(project(center, Config.layout.boardSize).x).toBe(center);
    expect(project(center, Config.layout.boardSize).y - project(center, 0).y)
      .toBeLessThan(Config.layout.boardSize);
  });
});
