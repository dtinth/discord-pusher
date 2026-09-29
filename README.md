# discord-pusher

A small Deno service that logs in to the Discord gateway (with `discord.js`) and
sends each raw gateway dispatch event to a Pusher-compatible server (for example
Sockudo or Pusher Channels).

## Purpose: nudges, not a log

The events are **nudges**. They tell consumers to refresh early. They are not a
reliable event log:

- The service publishes each event immediately. It has no queue, no order
  guarantee, no batching, and no retries.
- If a publish fails (for example HTTP 413 when the payload is larger than the
  server limit, a network error, or a 5xx response), the service writes a
  warning to the log and continues.

Thus, consumers must still poll the Discord REST API at a long interval. They
refresh early when an event arrives, and when their Pusher connection
reconnects.

## Setup

```sh
cp .env.example .env
# edit .env
```

| Variable          | Required | Description                                                                |
| ----------------- | -------- | -------------------------------------------------------------------------- |
| `DISCORD_TOKEN`   | yes      | Discord bot token.                                                         |
| `PUSHER_URL`      | yes      | `https://<key>:<secret>@<host>[:<port>]/apps/<app_id>`                     |
| `PUSHER_CHANNEL`  | yes      | The channel that receives all events, for example `private-discord`.       |
| `DISCORD_INTENTS` | no       | Comma-separated gateway intents (see [Intents](#intents)). Default: Guilds |
| `PORT`            | no       | HTTP port. Default: `8000`.                                                |

If a required variable is missing, the service exits with a non-zero code and a
message that names the variable.

The service uses the official [`pusher`](https://www.npmjs.com/package/pusher)
package with `Pusher.forURL(PUSHER_URL)`.

### Private channels

To use a private channel, add the `private-` prefix to `PUSHER_CHANNEL` (for
example `private-discord`). No other change is necessary to publish.

This service does not supply a subscriber auth endpoint. Consumers that
subscribe to a private channel must get authorization from a different service.
`private-encrypted-` channels are not supported.

## Event format

For each gateway dispatch packet (a packet where `t` is not null), the service
triggers one Pusher event:

- **Channel:** the value of `PUSHER_CHANNEL`
- **Event name:** the dispatch type `t`, for example `MESSAGE_CREATE`
- **Data:** the full gateway packet as JSON:

  ```json
  { "t": "MESSAGE_CREATE", "s": 42, "op": 0, "d": { "...": "..." } }
  ```

Packets that are not dispatch packets (for example heartbeat ACKs) are not sent.

## Run

```sh
deno task dev    # watch mode
deno task start  # plain run
deno task test   # run the tests
```

## HTTP endpoints

- `GET /` — the text `discord-pusher is running`.
- `GET /health` — `{ "ok": true, "ready": <boolean> }`. `ready` is `true` when
  the Discord gateway client is connected and ready.
- All other paths return 404.

## Docker

```sh
docker build -t discord-pusher .
docker run --rm -p 8000:8000 \
  -e DISCORD_TOKEN=... \
  -e PUSHER_URL=https://key:secret@pusher.example.com/apps/123 \
  -e PUSHER_CHANNEL=private-discord \
  -e DISCORD_INTENTS=Guilds,GuildMessages \
  discord-pusher
```

Images are also built and published to
[`ghcr.io/dtinth/discord-pusher`](https://github.com/dtinth/discord-pusher/pkgs/container/discord-pusher)
by the `Docker` GitHub Actions workflow on every push to `main` (tag `latest`),
on version tags (`v*`), and as a build-only smoke test on pull requests.

## Intents

`DISCORD_INTENTS` is a comma-separated list of `GatewayIntentBits` names (see
the
[discord.js docs](https://discord.js.org/docs/packages/discord.js/main/GatewayIntentBits:Enum)).
Privileged intents (`GuildMembers`, `GuildPresences`, `MessageContent`) must
also be enabled for the bot in the Discord Developer Portal.
