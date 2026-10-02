import { describe, expect, it } from 'vitest';
import { vibrantColor } from '../src/core/Color';

describe('vibrant colors', () => {
  it('strengthens colorful palette entries while preserving white and neutrals', () => {
    expect(vibrantColor('#4cc9f0')).toBe('#2dd9ff');
    expect(vibrantColor('#ffffff')).toBe('#ffffff');
    expect(vibrantColor('#dedede')).toBe('#dedede');
  });
});
