class Counter {
  private value: number = 0;

  add(n: number) {
    this.value += n;
  }

  get() {
    return this.value;
  }
}

class Duration {
  private durations: number[] = [];

  record(duration: number) {
    this.durations.push(duration);
  }

  getAverage() {
    if (this.durations.length === 0) return 0;
    return this.durations.reduce((a, b) => a + b, 0) / this.durations.length;
  }
}

// Query metrics
export const queryCounter = new Counter();
export const queryDuration = new Duration();
export const queryErrors = new Counter();

// GraphQL metrics
export const graphqlRequestDuration = new Duration();
export const graphqlErrors = new Counter();

// Cache metrics
export const cacheHits = new Counter();
export const cacheMisses = new Counter();