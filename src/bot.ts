import { Client, Events, GatewayIntentBits } from 'discord.js'
import type { Publisher } from './publisher.ts'

export interface GatewayEvent {
  /** Dispatch event name, e.g. "MESSAGE_CREATE". Absent for non-dispatch opcodes. */
  t: string | null
  /** Sequence number. */
  s: number | null
  /** Gateway opcode. */
  op: number
  /** Event payload. */
  d: unknown
}

function parseIntents(raw: string | undefined): number[] {
  const names = (raw ?? 'Guilds')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  return names.map((name) => {
    const bit = GatewayIntentBits[name as keyof typeof GatewayIntentBits]
    if (bit === undefined) {
      throw new Error(
        `Unknown gateway intent "${name}". See https://discord.js.org/docs/packages/discord.js/main/GatewayIntentBits:Enum`,
      )
    }
    return bit
  })
}

export function createBot(
  token: string,
  publisher: Publisher,
  intentsEnv?: string,
) {
  const client = new Client({ intents: parseIntents(intentsEnv) })

  client.on(Events.Raw, (packet: GatewayEvent) => {
    publisher.publish(packet)
  })

  client.once(Events.ClientReady, (c) => {
    console.log(`[bot] logged in as ${c.user.tag}`)
  })

  client.on(Events.Error, (err) => {
    console.error('[bot] client error', err)
  })

  async function start() {
    await client.login(token)
  }

  function isReady() {
    return client.isReady()
  }

  return { client, start, isReady }
}
