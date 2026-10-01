import { Config } from '../core/Config';
import { LocalPlatform } from './LocalPlatform';

export type MockScenario = 'playing' | 'blocked' | 'rewarded-success' | 'rewarded-failure';

export class MockPlatform extends LocalPlatform {
  readonly log: string[] = [];
  scenario: MockScenario = 'blocked';
  private adPlaying = false;
  override async init() { this.log.push('init'); }
  override loadingFinished() { this.log.push('loadingFinished'); }
  override gameplayStart() { this.log.push('gameplayStart'); }
  override gameplayStop() { this.log.push('gameplayStop'); }
  override isAdPlaying() { return this.adPlaying; }
  private async simulate(rewarded: boolean) {
    this.log.push(rewarded ? 'rewardedBreak' : 'commercialBreak');
    if (this.scenario === 'blocked') return false;
    this.adPlaying = true;
    try {
      await new Promise(resolve => setTimeout(resolve, Config.ads.mockDurationMs));
      return rewarded && this.scenario === 'rewarded-success';
    } finally { this.adPlaying = false; }
  }
  override async commercialBreak() { await this.simulate(false); }
  override rewardedBreak() { return this.simulate(true); }
}
