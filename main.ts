import { createBot } from './src/bot.ts'
import { createHandler } from './src/server.ts'

const token = Deno.env.get('DISCORD_TOKEN')
if (!token) {
  console.error('Missing DISCORD_TOKEN environment variable.')
  Deno.exit(1)
}

const eventsToken = Deno.env.get('EVENTS_TOKEN')
if (!eventsToken) {
  console.error(
    'Missing EVENTS_TOKEN environment variable. Set it to a secret consumers must present to read /events.',
  )
  Deno.exit(1)
}

const port = Number(Deno.env.get('PORT') ?? '8000')

const bot = createBot(token, Deno.env.get('DISCORD_INTENTS'))
await bot.start()

Deno.serve({ port }, createHandler(bot.events, eventsToken))
console.log(
  `[server] streaming gateway events at http://localhost:${port}/events`,
)
