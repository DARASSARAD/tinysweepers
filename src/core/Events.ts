export class Events<T> {
  private readonly listeners = new Set<(event: T) => void>();

  on(listener: (event: T) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: T) {
    for (const listener of this.listeners) listener(event);
  }
}
