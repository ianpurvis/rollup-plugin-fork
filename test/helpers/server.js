import { once } from 'events'
import Koa from 'koa'

export async function setup({ context, log }) {
  log('Setting up server')
  const app = new Koa()
  const server = app.listen({ port: 0, host: 'localhost' })
  await once(server, 'listening')
  Object.assign(context, { app, server })
}

export async function teardown({ context, log }) {
  log('Tearing down server')
  context.server.close()
  await once(context.server, 'close')
  delete context.server
}
