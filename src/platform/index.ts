import { LocalPlatform } from './LocalPlatform';
import { MockPlatform } from './MockPlatform';

declare const __PLATFORM__: 'local' | 'poki' | 'crazygames';

// Portal builds remain offline-playable pending verified SDK adapters.
export function createPlatform() {
  return __PLATFORM__ === 'local' ? new MockPlatform() : new LocalPlatform();
}
