export class SpeedBoost {
  active = false;
  constructor(public remainingMs = 300_000) {}
  toggle() { this.active = this.remainingMs > 0 && !this.active; }
  reset() { this.active = false; }
  advance(realMs: number, gameplayMs: number) {
    if (!this.active || realMs <= 0) return gameplayMs;
    const boosted = Math.min(realMs, this.remainingMs);
    this.remainingMs = Math.max(0, this.remainingMs - realMs);
    if (!this.remainingMs) this.active = false;
    return gameplayMs * (1 + boosted / realMs);
  }
}
