export class CoinRewardTimeline {
  elapsed = 0;
  readonly count = 10;
  readonly popMs = 250;
  readonly holdMs = 180;
  readonly flightMs = 750;
  phase(index: number) { return this.elapsed - 450 - index * 60; }
  get ready() { return this.phase(this.count - 1) >= this.popMs + this.holdMs + this.flightMs; }
  update(delta: number) { if (Number.isFinite(delta) && delta > 0) this.elapsed += delta; }
}
