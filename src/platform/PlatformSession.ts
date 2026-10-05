import { Config } from '../core/Config';
import { SafeStorage } from '../core/Storage';
import type { Platform } from './Platform';

interface AdHooks { blockInput(blocked: boolean): void; muteAudio(muted: boolean): void }

export class PlatformSession implements Platform {
  private playing = false;
  private loaded = false;
  private adPlaying = false;
  private ready = false;
  private readonly fallback = new SafeStorage();

  constructor(private readonly adapter: Platform, private readonly hooks: AdHooks,
    private readonly adsEnabled = true) {}
  async init() {
    try { await this.adapter.init(); this.ready = true; }
    catch { this.ready = false; }
  }
  loadingFinished() {
    if (this.loaded || this.isAdPlaying()) return;
    this.loaded = true;
    if (this.ready) this.adapter.loadingFinished();
  }
  gameplayStart() {
    if (this.playing || this.isAdPlaying()) return;
    this.playing = true;
    if (this.ready) this.adapter.gameplayStart();
  }
  gameplayStop() {
    if (!this.playing || this.isAdPlaying()) return;
    this.playing = false;
    if (this.ready) this.adapter.gameplayStop();
  }
  isAdPlaying() { return this.adPlaying || this.adapter.isAdPlaying(); }
  canShowRewardedAd() { return this.adsEnabled && this.ready && (this.adapter.canShowRewardedAd?.() ?? false); }

  private async ad(rewarded: boolean): Promise<boolean> {
    if (!this.adsEnabled || !this.ready || this.isAdPlaying()) return false;
    this.gameplayStop();
    this.adPlaying = true;
    this.hooks.blockInput(true);
    this.hooks.muteAudio(true);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<boolean>(resolve => {
        timer = setTimeout(() => { if (!this.adapter.isAdPlaying()) resolve(false); }, Config.ads.timeoutMs);
      });
      const request = rewarded ? this.adapter.rewardedBreak() : this.adapter.commercialBreak().then(() => false);
      return await Promise.race([request, timeout]);
    } catch { return false; }
    finally {
      clearTimeout(timer);
      this.adPlaying = false;
      this.hooks.muteAudio(false);
      this.hooks.blockInput(false);
      // Gameplay resumes only on the player's next action.
    }
  }
  async commercialBreak() { await this.ad(false); }
  rewardedBreak() { return this.ad(true); }
  async saveData(key: string, value: string) {
    this.fallback.set(key, value);
    if (this.ready) try { await this.adapter.saveData(key, value); } catch { /* Session fallback is already saved. */ }
  }
  async loadData(key: string) {
    if (this.ready) try { return await this.adapter.loadData(key) ?? this.fallback.get(key); } catch { /* Use fallback. */ }
    return this.fallback.get(key);
  }
}
