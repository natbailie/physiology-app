/** Fixed-capacity circular buffer, used for chart history so memory stays bounded. */
export class RingBuffer<T> {
  private readonly capacity: number;
  private readonly buffer: T[];
  private writeIndex = 0;
  private count = 0;

  constructor(capacity: number) {
    if (capacity <= 0) throw new Error('RingBuffer capacity must be positive');
    this.capacity = capacity;
    this.buffer = new Array<T>(capacity);
  }

  push(value: T): void {
    this.buffer[this.writeIndex] = value;
    this.writeIndex = (this.writeIndex + 1) % this.capacity;
    this.count = Math.min(this.count + 1, this.capacity);
  }

  get length(): number {
    return this.count;
  }

  /** Returns items in chronological order (oldest first). */
  toArray(): T[] {
    if (this.count < this.capacity) {
      return this.buffer.slice(0, this.count);
    }
    return [...this.buffer.slice(this.writeIndex), ...this.buffer.slice(0, this.writeIndex)];
  }
}
