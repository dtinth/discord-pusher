import { assertEquals } from '@std/assert'
import type { GatewayEvent } from './bot.ts'
import { createPusherPublisher, type PusherTrigger } from './publisher.ts'

interface Call {
  channel: string
  event: string
  data: unknown
}

function fakePusher(fail: (call: Call) => unknown = () => undefined) {
  const calls: Call[] = []
  const pusher: PusherTrigger = {
    trigger(channel, event, data) {
      const call = { channel, event, data }
      calls.push(call)
      const error = fail(call)
      return error ? Promise.reject(error) : Promise.resolve({})
    },
  }
  return { pusher, calls }
}

// Lets pending promise callbacks run.
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

const messageCreate: GatewayEvent = {
  t: 'MESSAGE_CREATE',
  s: 42,
  op: 0,
  d: { id: '1', content: 'hello' },
}

Deno.test('a dispatch packet causes one trigger with the full packet', async () => {
  const { pusher, calls } = fakePusher()
  const publisher = createPusherPublisher(pusher, 'private-discord')

  publisher.publish(messageCreate)
  await flush()

  assertEquals(calls, [
    {
      channel: 'private-discord',
      event: 'MESSAGE_CREATE',
      data: messageCreate,
    },
  ])
})

Deno.test('a packet with t: null causes no trigger', async () => {
  const { pusher, calls } = fakePusher()
  const publisher = createPusherPublisher(pusher, 'discord')

  publisher.publish({ t: null, s: null, op: 11, d: null })
  await flush()

  assertEquals(calls, [])
})

Deno.test('a failed trigger logs a warning and later events are still published', async () => {
  const { pusher, calls } = fakePusher((call) =>
    call.event === 'GUILD_CREATE'
      ? new Error('Unexpected status code 413')
      : undefined
  )
  const warnings: unknown[][] = []
  const publisher = createPusherPublisher(
    pusher,
    'discord',
    (...args) => warnings.push(args),
  )

  publisher.publish({ t: 'GUILD_CREATE', s: 1, op: 0, d: {} })
  publisher.publish(messageCreate)
  await flush()

  assertEquals(calls.map((c) => c.event), ['GUILD_CREATE', 'MESSAGE_CREATE'])
  assertEquals(warnings.length, 1)
  const [message, error] = warnings[0]
  assertEquals(message, '[pusher] failed to publish GUILD_CREATE (seq 1):')
  assertEquals((error as Error).message, 'Unexpected status code 413')
})

Deno.test('a trigger that throws synchronously is also logged', async () => {
  const warnings: unknown[][] = []
  const pusher: PusherTrigger = {
    trigger() {
      throw new Error('Invalid channel name')
    },
  }
  const publisher = createPusherPublisher(
    pusher,
    'discord',
    (...args) => warnings.push(args),
  )

  publisher.publish(messageCreate)
  await flush()

  assertEquals(warnings.length, 1)
})
