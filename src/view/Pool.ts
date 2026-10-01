export class Pool<T> {
  private readonly available: T[] = [];
  constructor(private readonly create: () => T) {}
  take(): T { return this.available.pop() ?? this.create(); }
  release(item: T) { this.available.push(item); }
  dispose(destroy: (item: T) => void) {
    this.available.splice(0).forEach(destroy);
  }
}
