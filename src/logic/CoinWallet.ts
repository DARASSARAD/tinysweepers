export class CoinWallet {
  private rewarded = false;
  private doubled = false;
  constructor(public balance = 500, readonly inventory: Record<string, number> = {}) {}

  static restore(raw: string | null, legacyBalance: number, legacyPickerCount: number) {
    try {
      const saved = JSON.parse(raw ?? 'null') as { balance?: number; inventory?: Record<string, number> } | null;
      if (saved && Number.isSafeInteger(saved.balance) && saved.balance! >= 0) {
        const inventory: Record<string, number> = {};
        for (const [item, count] of Object.entries(saved.inventory ?? {})) {
          if (Number.isSafeInteger(count) && count >= 0) inventory[item] = count;
        }
        return new CoinWallet(saved.balance, inventory);
      }
    } catch { /* Migrate older saves when the wallet cannot be read. */ }
    return new CoinWallet(legacyBalance, { cratePicker: legacyPickerCount });
  }

  beginAttempt() { this.rewarded = false; this.doubled = false; }
  doubleWinReward(adCompleted: boolean) {
    if (!adCompleted || !this.rewarded || this.doubled || !Number.isSafeInteger(this.balance + 50)) return 0;
    this.doubled = true;
    this.balance += 50;
    return 50;
  }
  awardWin() {
    if (this.rewarded || !Number.isSafeInteger(this.balance + 50)) return 0;
    this.rewarded = true;
    this.balance += 50;
    return 50;
  }

  spend(price: number) {
    if (!Number.isSafeInteger(price) || price <= 0 || this.balance < price) return false;
    this.balance -= price;
    return true;
  }

  buyPowerup(item: string, price: number, quantity = 1) {
    if (!item || !Number.isSafeInteger(price) || price <= 0 || !Number.isSafeInteger(quantity) || quantity <= 0
      || this.balance < price || !Number.isSafeInteger((this.inventory[item] ?? 0) + quantity)) return false;
    this.balance -= price;
    this.inventory[item] = (this.inventory[item] ?? 0) + quantity;
    return true;
  }

  serialize() { return JSON.stringify({ version: 1, balance: this.balance, inventory: this.inventory }); }
}
