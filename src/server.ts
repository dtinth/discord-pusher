import type { Broadcaster } from './broadcaster.ts'
import type { GatewayEvent } from './bot.ts'

function sseResponse(
  events: Broadcaster<GatewayEvent>,
  filterType: string | null,
) {
  const encoder = new TextEncoder()

  let unsubscribe = () => {}
  let heartbeat = 0

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: GatewayEvent) => {
        if (filterType && event.t !== filterType) return
        const payload = `event: ${event.t ?? 'gateway'}\ndata: ${
          JSON.stringify(event)
        }\n\n`
        controller.enqueue(encoder.encode(payload))
      }

      // initial comment so clients see the connection is alive immediately
      controller.enqueue(encoder.encode(': connected\n\n'))

      unsubscribe = events.subscribe(send)
      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': ping\n\n'))
      }, 15_000)
    },
    cancel() {
      clearInterval(heartbeat)
      unsubscribe()
    },
  })

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
      'access-control-allow-origin': '*',
    },
  })
}

export function createHandler(events: Broadcaster<GatewayEvent>) {
  return (req: Request): Response => {
    const url = new URL(req.url)

    if (url.pathname === '/events') {
      return sseResponse(events, url.searchParams.get('type'))
    }

    if (url.pathname === '/health') {
      return Response.json({ ok: true, subscribers: events.size })
    }

    return new Response('Not found. Try GET /events', { status: 404 })
  }
}
