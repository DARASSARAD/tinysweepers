import { SafeStorage } from '../core/Storage';
import type { Platform } from './Platform';

export class LocalPlatform implements Platform {
  constructor(private readonly storage = new SafeStorage()) {}
  async init() {}
  loadingFinished() {}
  gameplayStart() {}
  gameplayStop() {}
  async commercialBreak() {}
  async rewardedBreak() { return false; }
  isAdPlaying() { return false; }
  canShowRewardedAd() { return false; }
  async saveData(key: string, value: string) { this.storage.set(key, value); }
  async loadData(key: string) { return this.storage.get(key); }
}
