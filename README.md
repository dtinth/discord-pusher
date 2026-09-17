# discord-sse

A small Deno service that logs into the Discord gateway (via `discord.js`) and
re-broadcasts every raw gateway dispatch event to HTTP clients as Server-Sent
Events.

## Setup

```sh
cp .env.example .env
# edit .env and set DISCORD_TOKEN, and DISCORD_INTENTS as needed
```

## Run

```sh
deno task dev    # watch mode
deno task start  # plain run
```

## Endpoints

- `GET /events` — SSE stream of all gateway dispatch events. Each message's
  `event:` field is the dispatch type (e.g. `MESSAGE_CREATE`) and `data:` is the
  JSON-encoded `{ t, s, op, d }` gateway packet.
- `GET /events?type=MESSAGE_CREATE` — SSE stream filtered to one dispatch type.
- `GET /health` — `{ ok: true, subscribers: <n> }`.

Example client:

```sh
curl -N http://localhost:8000/events
```

## Intents

`DISCORD_INTENTS` is a comma-separated list of `GatewayIntentBits` names (see
the
[discord.js docs](https://discord.js.org/docs/packages/discord.js/main/GatewayIntentBits:Enum)).
Privileged intents (`GuildMembers`, `GuildPresences`, `MessageContent`) must
also be enabled for the bot in the Discord Developer Portal.
