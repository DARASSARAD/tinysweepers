import { LocalPlatform } from './LocalPlatform';
import { MockPlatform } from './MockPlatform';
import { CrazyGamesPlatform } from './CrazyGamesPlatform';

declare const __PLATFORM__: 'local' | 'poki' | 'crazygames';

export function createPlatform() {
  if (__PLATFORM__ === 'crazygames') return new CrazyGamesPlatform();
  return __PLATFORM__ === 'local' ? new MockPlatform() : new LocalPlatform();
}
