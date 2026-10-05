import { LocalPlatform } from './LocalPlatform';

export interface CrazyGamesSDK {
  init(): Promise<void>;
  readonly environment: 'local' | 'crazygames' | 'disabled';
  game: { loadingStop(): void; gameplayStart(): void; gameplayStop(): void };
}

export const crazyGamesInitTimeoutMs = 5000;

// Basic Launch: game lifecycle only. Ads and saving use LocalPlatform defaults.
export class CrazyGamesPlatform extends LocalPlatform {
  private ready = false;
  constructor(private sdk?: CrazyGamesSDK) { super(); }
  override async init() {
    this.ready = false;
    this.sdk ??= (window as Window & { CrazyGames?: { SDK: CrazyGamesSDK } }).CrazyGames?.SDK;
    if (!this.sdk) throw new Error('CrazyGames SDK unavailable');
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        this.sdk.init(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('CrazyGames SDK initialization timed out')), crazyGamesInitTimeoutMs);
        }),
      ]);
      if (this.sdk.environment !== 'local' && this.sdk.environment !== 'crazygames') {
        throw new Error('CrazyGames SDK disabled on this domain');
      }
      this.ready = true;
    } finally { clearTimeout(timer); }
  }
  private event(name: 'loadingStop' | 'gameplayStart' | 'gameplayStop') {
    if (!this.ready) return;
    try { this.sdk!.game[name](); }
    catch { /* A portal event must never interrupt local gameplay. */ }
  }
  override loadingFinished() { this.event('loadingStop'); }
  override gameplayStart() { this.event('gameplayStart'); }
  override gameplayStop() { this.event('gameplayStop'); }
}
