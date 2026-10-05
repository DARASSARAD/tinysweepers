import { expect, it } from 'vitest';
import { CoinWallet } from '../src/logic/CoinWallet';

it('spends coins without adding inventory and rejects invalid or unaffordable purchases', () => {
  const wallet = new CoinWallet(1500);
  expect(wallet.spend(1000)).toBe(true);
  expect(wallet.balance).toBe(500);
  for (const price of [1000, 0, -1, 1.5, NaN]) expect(wallet.spend(price)).toBe(false);
  expect(wallet.balance).toBe(500);
  expect(wallet.inventory).toEqual({});
});

it('doubles only a won attempt after a completed ad, once per attempt', () => {
  const wallet = new CoinWallet();
  expect(wallet.doubleWinReward(true)).toBe(0);
  wallet.awardWin();
  expect(wallet.doubleWinReward(false)).toBe(0);
  expect(wallet.balance).toBe(550);
  expect(wallet.doubleWinReward(true)).toBe(50);
  expect(wallet.doubleWinReward(true)).toBe(0);
  expect(CoinWallet.restore(wallet.serialize(), 500, 0).balance).toBe(600);
  wallet.beginAttempt();
  expect(wallet.doubleWinReward(true)).toBe(0);
  wallet.awardWin();
  expect(wallet.doubleWinReward(true)).toBe(50);
  expect(wallet.balance).toBe(700);
});

it('migrates existing coins and powerups without repeating the starting grant', () => {
  const fresh = CoinWallet.restore(null, 500, 2);
  expect(fresh.balance).toBe(500);
  expect(fresh.inventory.cratePicker).toBe(2);
  fresh.beginAttempt();
  fresh.awardWin();
  const restored = CoinWallet.restore(fresh.serialize(), 500, 99);
  expect(restored.balance).toBe(550);
  expect(restored.inventory.cratePicker).toBe(2);
  expect(CoinWallet.restore(null, 0, 0).balance).toBe(0);
});

it('rewards each winning attempt once while allowing replay wins', () => {
  const wallet = new CoinWallet();
  expect(wallet.awardWin()).toBe(50);
  expect(wallet.awardWin()).toBe(0);
  expect(wallet.balance).toBe(550);
  wallet.beginAttempt();
  expect(wallet.awardWin()).toBe(50);
  expect(wallet.balance).toBe(600);
});

it('saves a purchase and item grant together and rejects insufficient funds', () => {
  const wallet = new CoinWallet(100, { cratePicker: 1 });
  expect(wallet.buyPowerup('cratePicker', 100)).toBe(true);
  const restored = CoinWallet.restore(wallet.serialize(), 500, 0);
  expect(restored.balance).toBe(0);
  expect(restored.inventory.cratePicker).toBe(2);
  const before = restored.serialize();
  expect(restored.buyPowerup('cratePicker', 1)).toBe(false);
  expect(restored.buyPowerup('cratePicker', -1)).toBe(false);
  expect(restored.buyPowerup('cratePicker', 0)).toBe(false);
  expect(restored.serialize()).toBe(before);
});

it('recovers invalid wallet data without destroying migrated inventory', () => {
  expect(CoinWallet.restore('broken', 750, 3).inventory.cratePicker).toBe(3);
  expect(CoinWallet.restore('{"balance":-10}', 750, 3).balance).toBe(750);
});
