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
  JSON-encoded `{ t, s, op, d }` gateway packet. Requires auth (see below).
- `GET /events?type=MESSAGE_CREATE` — SSE stream filtered to one dispatch type.
- `GET /health` — `{ ok: true, subscribers: <n> }`. Not protected.

## Auth

`/events` requires the secret in `EVENTS_TOKEN` to be presented either as:

- `Authorization: Bearer <token>` header, or
- `?token=<token>` query parameter (for clients like browser `EventSource` that
  can't set custom headers)

Example client:

```sh
curl -N -H "Authorization: Bearer $EVENTS_TOKEN" http://localhost:8000/events
# or
curl -N "http://localhost:8000/events?token=$EVENTS_TOKEN"
```

## Docker

```sh
docker build -t discord-sse .
docker run --rm -p 8000:8000 \
  -e DISCORD_TOKEN=... \
  -e EVENTS_TOKEN=... \
  -e DISCORD_INTENTS=Guilds,GuildMessages \
  discord-sse
```

Images are also built and published to
[`ghcr.io/dtinth/discord-sse`](https://github.com/dtinth/discord-sse/pkgs/container/discord-sse)
by the `Docker` GitHub Actions workflow on every push to `main` (tag `latest`),
on version tags (`v*`), and as a build-only smoke test on pull requests.

## Intents

`DISCORD_INTENTS` is a comma-separated list of `GatewayIntentBits` names (see
the
[discord.js docs](https://discord.js.org/docs/packages/discord.js/main/GatewayIntentBits:Enum)).
Privileged intents (`GuildMembers`, `GuildPresences`, `MessageContent`) must
also be enabled for the bot in the Discord Developer Portal.
