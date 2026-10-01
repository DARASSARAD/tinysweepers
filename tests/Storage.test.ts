import { expect, it } from 'vitest';
import { SafeStorage } from '../src/core/Storage';

it('keeps saves available when storage access throws', () => {
  const storage = new SafeStorage(() => { throw new Error('Storage disabled'); });
  expect(storage.get('progress')).toBeNull();
  expect(() => storage.set('progress', '2')).not.toThrow();
  expect(storage.get('progress')).toBe('2');
});
it('retains a session copy when persistent writes throw', () => {
  const storage = new SafeStorage(() => ({ getItem: () => 'true', setItem: () => { throw new Error('Quota exceeded'); } }));
  storage.set('sound', 'false');
  expect(storage.get('sound')).toBe('false');
});
