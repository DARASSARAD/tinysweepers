import { BoosterUnlock } from './BoosterUnlock';

// All booster introductions share the original level 5 panel and typography.
export class NewBoosterUnlock extends BoosterUnlock {
  constructor(kind: 'shuffle' | 'bigVacuum', onClaim: () => void) {
    super(onClaim, kind);
  }
}
