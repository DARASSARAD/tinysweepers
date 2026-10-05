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

it('keeps the full scene inside asymmetric safe areas', () => {
  const insets = { top: 59, right: 12, bottom: 34, left: 20 };
  for (const [width, height] of [[390, 844], [844, 390], [800, 450]]) {
    const layout = fitPlayArea(width, height, insets);
    expect(layout.x).toBeGreaterThanOrEqual(insets.left);
    expect(layout.y).toBeGreaterThanOrEqual(insets.top);
    expect(layout.x + Config.designWidth * layout.scale).toBeLessThanOrEqual(width - insets.right);
    expect(layout.y + Config.designHeight * layout.scale).toBeLessThanOrEqual(height - insets.bottom);
  }
});
