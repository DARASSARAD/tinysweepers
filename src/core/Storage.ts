export class SafeStorage {
  private readonly memory = new Map<string, string>();
  constructor(private readonly provider: () => Pick<Storage, 'getItem' | 'setItem'> = () => localStorage) {}
  get(key: string): string | null {
    if (this.memory.has(key)) return this.memory.get(key)!;
    try { return this.provider().getItem(key) ?? this.memory.get(key) ?? null; }
    catch { return this.memory.get(key) ?? null; }
  }
  set(key: string, value: string) {
    this.memory.set(key, value);
    try { this.provider().setItem(key, value); }
    catch { /* The session copy keeps the game playable. */ }
  }
}
