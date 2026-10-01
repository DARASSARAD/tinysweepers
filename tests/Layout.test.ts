import { describe, expect, it } from 'vitest';
import { fitPlayArea } from '../src/core/Layout';
import { Config } from '../src/core/Config';

describe('responsive play area', () => {
  it.each([[390, 844], [1920, 1080], [768, 1024]])('fits a %i × %i viewport', (width, height) => {
    const layout = fitPlayArea(width, height);
    expect(layout.x).toBeGreaterThanOrEqual(0);
    expect(layout.y).toBeGreaterThanOrEqual(0);
    expect(Config.designWidth * layout.scale).toBeLessThanOrEqual(width);
    expect(Config.designHeight * layout.scale).toBeLessThanOrEqual(height);
  });
});
