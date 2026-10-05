import { afterEach, expect, it, vi } from 'vitest';
import { CrazyGamesPlatform, crazyGamesInitTimeoutMs, type CrazyGamesSDK } from '../src/platform/CrazyGamesPlatform';
import { PlatformSession } from '../src/platform/PlatformSession';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
function fixture(environment: CrazyGamesSDK['environment'] = 'local') {
  const sdk: CrazyGamesSDK = {
    environment, init: vi.fn(async () => {}),
    game: { loadingStop: vi.fn(), gameplayStart: vi.fn(), gameplayStop: vi.fn() },
  };
  return { platform: new CrazyGamesPlatform(sdk), sdk };
}
it('awaits initialization before reporting game events', async () => {
  const f = fixture(); let initialized!: () => void;
  vi.mocked(f.sdk.init).mockImplementation(() => new Promise(resolve => { initialized = resolve; }));
  const pending = f.platform.init(); f.platform.gameplayStart();
  expect(f.sdk.game.gameplayStart).not.toHaveBeenCalled();
  initialized(); await pending;
  f.platform.loadingFinished(); f.platform.gameplayStart(); f.platform.gameplayStop();
  expect(f.sdk.game.loadingStop).toHaveBeenCalledOnce();
  expect(f.sdk.game.gameplayStart).toHaveBeenCalledOnce();
  expect(f.sdk.game.gameplayStop).toHaveBeenCalledOnce();
});
it('retrieves the SDK from the browser global', async () => {
  const f = fixture('crazygames'); vi.stubGlobal('window', { CrazyGames: { SDK: f.sdk } });
  const adapter = new CrazyGamesPlatform(); await adapter.init(); adapter.gameplayStart();
  expect(f.sdk.init).toHaveBeenCalledOnce(); expect(f.sdk.game.gameplayStart).toHaveBeenCalledOnce();
});
it('skips events on a disabled domain', async () => {
  const f = fixture('disabled'); await expect(f.platform.init()).rejects.toThrow('disabled');
  f.platform.loadingFinished(); f.platform.gameplayStart();
  expect(f.sdk.game.loadingStop).not.toHaveBeenCalled(); expect(f.sdk.game.gameplayStart).not.toHaveBeenCalled();
});
it('continues when the SDK is missing or initialization rejects', async () => {
  vi.stubGlobal('window', {});
  const missing = new PlatformSession(new CrazyGamesPlatform(), { blockInput: vi.fn(), muteAudio: vi.fn() }, false);
  await expect(missing.init()).resolves.toBeUndefined();
  expect(() => { missing.loadingFinished(); missing.gameplayStart(); }).not.toThrow();
  const f = fixture(); vi.mocked(f.sdk.init).mockRejectedValue(new Error('Blocked'));
  const failed = new PlatformSession(f.platform, { blockInput: vi.fn(), muteAudio: vi.fn() }, false);
  await failed.init(); failed.gameplayStart(); expect(f.sdk.game.gameplayStart).not.toHaveBeenCalled();
});
it('times out initialization and ignores late completion', async () => {
  vi.useFakeTimers(); const f = fixture(); let complete!: () => void;
  vi.mocked(f.sdk.init).mockImplementation(() => new Promise(resolve => { complete = resolve; }));
  const result = expect(f.platform.init()).rejects.toThrow('timed out');
  await vi.advanceTimersByTimeAsync(crazyGamesInitTimeoutMs); await result;
  complete(); await Promise.resolve(); f.platform.gameplayStart();
  expect(f.sdk.game.gameplayStart).not.toHaveBeenCalled();
});
it('never requests ads and deduplicates lifecycle events', async () => {
  const f = fixture(); const ad = { requestAd: vi.fn() }; Object.assign(f.sdk, { ad });
  const session = new PlatformSession(f.platform, { blockInput: vi.fn(), muteAudio: vi.fn() }, false);
  await session.init(); session.loadingFinished(); session.loadingFinished();
  session.gameplayStart(); session.gameplayStart(); session.gameplayStop(); session.gameplayStop();
  expect(f.sdk.game.loadingStop).toHaveBeenCalledOnce(); expect(f.sdk.game.gameplayStart).toHaveBeenCalledOnce();
  expect(f.sdk.game.gameplayStop).toHaveBeenCalledOnce();
  await session.commercialBreak(); expect(await session.rewardedBreak()).toBe(false);
  expect(session.canShowRewardedAd()).toBe(false); expect(ad.requestAd).not.toHaveBeenCalled();
});
it('contains thrown portal event errors', async () => {
  const f = fixture(); await f.platform.init();
  vi.mocked(f.sdk.game.gameplayStart).mockImplementation(() => { throw new Error('Portal failure'); });
  expect(() => f.platform.gameplayStart()).not.toThrow();
});
