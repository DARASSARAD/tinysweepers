import { expect, it } from 'vitest';
import { CoinRewardTimeline } from '../src/view/CoinRewardTimeline';

it('keeps actions locked until the last staggered coin completes its flight', () => {
  const timeline = new CoinRewardTimeline();
  timeline.update(1629);
  expect(timeline.phase(0)).toBeLessThan(timeline.popMs + timeline.holdMs + timeline.flightMs);
  expect(timeline.ready).toBe(false);
  timeline.update(1);
  expect(timeline.phase(0)).toBe(timeline.popMs + timeline.holdMs + timeline.flightMs);
  expect(timeline.ready).toBe(false);
  timeline.update(539);
  expect(timeline.ready).toBe(false);
  timeline.update(1);
  expect(timeline.ready).toBe(true);
});

it('finishes for a large frame and ignores invalid elapsed time', () => {
  const timeline = new CoinRewardTimeline();
  timeline.update(Number.NaN);
  timeline.update(-1);
  expect(timeline.elapsed).toBe(0);
  timeline.update(5000);
  expect(timeline.ready).toBe(true);
});
