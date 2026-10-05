import { afterEach, describe, expect, it, vi } from 'vitest';
import { Config } from '../src/core/Config';
import { MockPlatform } from '../src/platform/MockPlatform';
import { PlatformSession } from '../src/platform/PlatformSession';

afterEach(() => vi.useRealTimers());
async function setup() {
  const adapter = new MockPlatform();
  let muted = false;
  let blocked = false;
  const session = new PlatformSession(adapter, {
    muteAudio: value => { muted = value; }, blockInput: value => { blocked = value; },
  });
  await session.init();
  session.loadingFinished();
  return { adapter, session, muted: () => muted, blocked: () => blocked };
}
describe('guarded platform flow', () => {
  it('Basic Launch never requests ads, blocks input, or changes audio', async () => {
    const adapter = new MockPlatform();
    adapter.scenario = 'rewarded-success';
    const blockInput = vi.fn();
    const muteAudio = vi.fn();
    const session = new PlatformSession(adapter, { blockInput, muteAudio }, false);
    await session.init();
    expect(session.canShowRewardedAd()).toBe(false);
    await session.commercialBreak();
    expect(await session.rewardedBreak()).toBe(false);
    expect(adapter.log).toEqual(['init']);
    expect(blockInput).not.toHaveBeenCalled();
    expect(muteAudio).not.toHaveBeenCalled();
  });
  it('offers rewards only after initialization and when the adapter supports them', async () => {
    const adapter = new MockPlatform();
    const session = new PlatformSession(adapter, { blockInput: () => {}, muteAudio: () => {} });
    expect(session.canShowRewardedAd()).toBe(false);
    await session.init();
    expect(session.canShowRewardedAd()).toBe(false);
    adapter.scenario = 'rewarded-success';
    expect(session.canShowRewardedAd()).toBe(true);
  });
  it('suppresses duplicate loading and gameplay events', async () => {
    const { adapter, session } = await setup();
    session.loadingFinished(); session.gameplayStart(); session.gameplayStart(); session.gameplayStop(); session.gameplayStop();
    expect(adapter.log).toEqual(['init','loadingFinished','gameplayStart','gameplayStop']);
  });
  it('mutes audio, blocks input and prevents SDK gameplay calls during ads', async () => {
    vi.useFakeTimers();
    const fixture = await setup();
    fixture.adapter.scenario = 'playing';
    fixture.session.gameplayStart();
    const ad = fixture.session.commercialBreak();
    expect(fixture.muted()).toBe(true); expect(fixture.blocked()).toBe(true);
    fixture.session.gameplayStart(); fixture.session.gameplayStop();
    expect(fixture.adapter.log).toEqual(['init','loadingFinished','gameplayStart','gameplayStop','commercialBreak']);
    await vi.advanceTimersByTimeAsync(Config.ads.mockDurationMs);
    await ad;
    expect(fixture.muted()).toBe(false); expect(fixture.blocked()).toBe(false);
    fixture.session.gameplayStart();
    expect(fixture.adapter.log.at(-1)).toBe('gameplayStart');
  });
  it('blocked ads resolve immediately and never grant a reward', async () => {
    const { session } = await setup();
    await session.commercialBreak();
    expect(await session.rewardedBreak()).toBe(false);
    expect(session.isAdPlaying()).toBe(false);
  });
  it.each([['rewarded-success',true], ['rewarded-failure',false]] as const)('rewards only a confirmed %s result', async (scenario, expected) => {
    vi.useFakeTimers();
    const { session, adapter } = await setup();
    adapter.scenario = scenario;
    const reward = session.rewardedBreak();
    await vi.advanceTimersByTimeAsync(Config.ads.mockDurationMs);
    expect(await reward).toBe(expected);
  });
  it('an adapter failure or unresolved request without an active ad cannot hang the session', async () => {
    vi.useFakeTimers();
    const { session, adapter } = await setup();
    adapter.commercialBreak = () => new Promise(() => {});
    const ad = session.commercialBreak();
    await vi.advanceTimersByTimeAsync(Config.ads.timeoutMs);
    await ad;
    expect(session.isAdPlaying()).toBe(false);
    adapter.rewardedBreak = () => Promise.reject(new Error('SDK blocked'));
    expect(await session.rewardedBreak()).toBe(false);
  });
  it('does not unmute or discard a confirmed reward while a legitimate ad is still playing', async () => {
    vi.useFakeTimers();
    const fixture = await setup();
    let finish!: (reward: boolean) => void;
    let playing = true;
    fixture.adapter.isAdPlaying = () => playing;
    // Start with no ad, then let the adapter begin it on request.
    playing = false;
    fixture.adapter.rewardedBreak = () => {
      playing = true;
      return new Promise(resolve => { finish = resolve; });
    };
    const reward = fixture.session.rewardedBreak();
    await vi.advanceTimersByTimeAsync(Config.ads.timeoutMs + 1);
    expect(fixture.blocked()).toBe(true);
    expect(fixture.muted()).toBe(true);
    playing = false;
    finish(true);
    expect(await reward).toBe(true);
    expect(fixture.blocked()).toBe(false);
  });
  it('produces the full play-through event sequence across a natural break', async () => {
    const { session, adapter } = await setup();
    session.gameplayStart(); session.gameplayStop(); await session.commercialBreak(); session.gameplayStart();
    expect(adapter.log).toEqual(['init','loadingFinished','gameplayStart','gameplayStop','commercialBreak','gameplayStart']);
  });
});
