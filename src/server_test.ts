import { assertEquals } from '@std/assert'
import { createHandler } from './server.ts'

const get = (path: string, ready = false) =>
  createHandler({ isReady: () => ready })(
    new Request(`http://localhost${path}`),
  )

Deno.test('GET / returns a running message', async () => {
  const res = get('/')
  assertEquals(res.status, 200)
  assertEquals(await res.text(), 'discord-pusher is running')
})

Deno.test('GET /health reports the gateway ready state', async () => {
  assertEquals(await get('/health', false).json(), { ok: true, ready: false })
  assertEquals(await get('/health', true).json(), { ok: true, ready: true })
})

Deno.test('GET /events returns 404', async () => {
  const res = get('/events')
  assertEquals(res.status, 404)
  await res.body?.cancel()
})
