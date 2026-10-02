import { describe, expect, it } from 'vitest';
import { robotMotion, robotPathPosition, robotRouteDuration, robotRouteMotion } from '../src/core/RobotPath';

describe('robot paths', () => {
  it('covers equal distances in equal time without acceleration', () => {
    const from = { x: 0, y: 100 };
    const to = { x: 100, y: 0 };
    const positions = [0.158, 0.234, 0.31].map(t => robotMotion(from, to, t, true, 0));
    expect(positions[0].x).toBeCloseTo(10);
    expect(positions[1].x - positions[0].x).toBeCloseTo(20);
    expect(positions[2].x - positions[1].x).toBeCloseTo(20);
    // Only rotation eases; straight travel remains linear.
    expect(robotMotion(from, to, 0.03, true, 0).heading).toBeCloseTo(Math.PI / 2 * 0.15625);
  });
  it('emerges upward from the dock before moving sideways', () => {
    const from = { x: 0, y: 300 };
    const to = { x: 100, y: 0 };
    const emerging = robotMotion(from, to, 0.2, true, 0, 100);
    expect(emerging.x).toBe(from.x);
    expect(emerging.y).toBeLessThan(from.y);
    expect(emerging.y).toBeGreaterThan(200);
    expect(emerging.heading).toBe(0);
    expect(robotMotion(from, to, 1, true, 0, 100)).toEqual({ ...to, heading: 0 });
  });
  it('turns in place, stops at the corner, and arrives at the destination', () => {
    const from = { x: 0, y: 100 };
    const to = { x: 100, y: 0 };
    const initialTurn = robotMotion(from, to, 0.06, true, 0);
    expect(initialTurn.x).toBe(0);
    expect(initialTurn.y).toBe(100);
    expect(initialTurn.heading).toBeCloseTo(Math.PI / 4);
    const cornerTurn = robotMotion(from, to, 0.56, true, 0);
    expect(cornerTurn.x).toBe(100);
    expect(cornerTurn.y).toBe(100);
    expect(cornerTurn.heading).toBeCloseTo(Math.PI / 4);
    expect(robotMotion(from, to, 1, true, 0)).toEqual({ ...to, heading: 0 });
  });
  it('moves horizontally before turning vertically on departure', () => {
    const from = { x: 0, y: 100 };
    const to = { x: 30, y: 30 };
    expect(robotPathPosition(from, to, 0.15, true)).toEqual({ x: 15, y: 100 });
    expect(robotPathPosition(from, to, 0.3, true)).toEqual({ x: 30, y: 100 });
    expect(robotPathPosition(from, to, 0.65, true)).toEqual({ x: 30, y: 65 });
    expect(robotPathPosition(from, to, 1, true)).toEqual(to);
  });
  it('moves vertically before turning toward the dustbin', () => {
    const from = { x: 80, y: 0 };
    const to = { x: 20, y: 40 };
    expect(robotPathPosition(from, to, 0.2, false)).toEqual({ x: 80, y: 20 });
    expect(robotPathPosition(from, to, 0.4, false)).toEqual({ x: 80, y: 40 });
    expect(robotPathPosition(from, to, 0.7, false)).toEqual({ x: 50, y: 40 });
    expect(robotPathPosition(from, to, 1, false)).toEqual(to);
  });
  it('handles straight paths and stationary pickup without invalid coordinates', () => {
    expect(robotPathPosition({ x: 5, y: 0 }, { x: 5, y: 100 }, 0.5, true)).toEqual({ x: 5, y: 50 });
    expect(robotPathPosition({ x: 0, y: 5 }, { x: 100, y: 5 }, 0.5, false)).toEqual({ x: 50, y: 5 });
    expect(robotPathPosition({ x: 5, y: 5 }, { x: 5, y: 5 }, 0.5, true)).toEqual({ x: 5, y: 5 });
  });
});


describe('route travel speed', () => {
  it('takes longer on longer routes while keeping straight travel speed constant', () => {
    for (const length of [200, 800]) {
      const route = [{ x: 0, y: 0 }, { x: length, y: 0 }];
      const duration = robotRouteDuration(route, 600);
      const a = robotRouteMotion(route, 0.3, 0);
      const b = robotRouteMotion(route, 0.4, 0);
      expect((b.x - a.x) / (duration * 0.1 / 1000)).toBeCloseTo(600);
    }
    expect(robotRouteDuration([{ x: 0, y: 0 }, { x: 800, y: 0 }], 600))
      .toBeCloseTo(robotRouteDuration([{ x: 0, y: 0 }, { x: 200, y: 0 }], 600) * 4);
  });
});
