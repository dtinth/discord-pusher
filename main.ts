import Pusher from 'pusher'
import { createBot } from './src/bot.ts'
import { createPusherPublisher } from './src/publisher.ts'
import { createHandler } from './src/server.ts'

function requireEnv(name: string, hint = ''): string {
  const value = Deno.env.get(name)
  if (!value) {
    console.error(`Missing ${name} environment variable.${hint}`)
    Deno.exit(1)
  }
  return value
}

const token = requireEnv('DISCORD_TOKEN')
const pusherUrl = requireEnv(
  'PUSHER_URL',
  ' Set it to https://<key>:<secret>@<host>[:<port>]/apps/<app_id>.',
)
const pusherChannel = requireEnv('PUSHER_CHANNEL')

const port = Number(Deno.env.get('PORT') ?? '8000')

const publisher = createPusherPublisher(
  Pusher.forURL(pusherUrl),
  pusherChannel,
)
const bot = createBot(token, publisher, Deno.env.get('DISCORD_INTENTS'))
await bot.start()

Deno.serve({ port }, createHandler({ isReady: bot.isReady }))
console.log(
  `[discord-pusher] publishing gateway events to Pusher channel "${pusherChannel}"`,
)
