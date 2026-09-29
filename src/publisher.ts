import type { GatewayEvent } from './bot.ts'

/**
 * Receives gateway packets from the bot.
 */
export interface Publisher {
  publish(event: GatewayEvent): void
}

/**
 * The part of the `pusher` client that the publisher uses.
 */
export interface PusherTrigger {
  trigger(channel: string, event: string, data: unknown): Promise<unknown>
}

/**
 * Creates a publisher that triggers one Pusher event for each gateway
 * dispatch packet. Packets without a dispatch type (`t` is null) are ignored.
 *
 * Events are nudges, not a reliable log: there is no queue, no ordering, and
 * no retry. A failed trigger is logged as a warning and then ignored.
 */
export function createPusherPublisher(
  pusher: PusherTrigger,
  channel: string,
  warn: (...args: unknown[]) => void = console.warn,
): Publisher {
  return {
    publish(event) {
      const type = event.t
      if (type === null) return
      Promise.resolve()
        .then(() => pusher.trigger(channel, type, event))
        .catch((error) => {
          warn(
            `[pusher] failed to publish ${type} (seq ${event.s}):`,
            error,
          )
        })
    },
  }
}
