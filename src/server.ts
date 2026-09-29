export interface HandlerOptions {
  /** Returns true when the Discord gateway client is connected and ready. */
  isReady: () => boolean
}

export function createHandler({ isReady }: HandlerOptions) {
  return (req: Request): Response => {
    const url = new URL(req.url)

    if (req.method === 'GET' && url.pathname === '/') {
      return new Response('discord-pusher is running')
    }

    if (req.method === 'GET' && url.pathname === '/health') {
      return Response.json({ ok: true, ready: isReady() })
    }

    return new Response('Not found', { status: 404 })
  }
}
