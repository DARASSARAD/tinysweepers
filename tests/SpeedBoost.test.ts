import { expect, it } from 'vitest';
import { SpeedBoost } from '../src/logic/SpeedBoost';

it('doubles game time while consuming only real time', () => {
  const speed = new SpeedBoost();
  speed.toggle();
  expect(speed.advance(1000, 50)).toBe(100);
  expect(speed.remainingMs).toBe(299_000);
  speed.toggle();
  expect(speed.advance(1000, 50)).toBe(50);
  expect(speed.remainingMs).toBe(299_000);
});

it('expires exactly without overspending the allowance', () => {
  const speed = new SpeedBoost(500);
  speed.toggle();
  expect(speed.advance(1000, 50)).toBe(75);
  expect(speed.remainingMs).toBe(0);
  expect(speed.active).toBe(false);
  speed.toggle();
  expect(speed.active).toBe(false);
});

it('resets speed on level exit while preserving unused time', () => {
  const speed = new SpeedBoost(2500);
  speed.toggle(); speed.advance(1000, 50); speed.reset();
  expect(speed.active).toBe(false);
  expect(speed.remainingMs).toBe(1500);
});
