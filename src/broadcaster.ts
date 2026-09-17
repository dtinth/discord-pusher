/**
 * Fan-out of events to any number of connected SSE clients.
 */
export class Broadcaster<T> {
  #subscribers = new Set<(event: T) => void>()

  subscribe(fn: (event: T) => void): () => void {
    this.#subscribers.add(fn)
    return () => this.#subscribers.delete(fn)
  }

  publish(event: T) {
    for (const fn of this.#subscribers) fn(event)
  }

  get size() {
    return this.#subscribers.size
  }
}
