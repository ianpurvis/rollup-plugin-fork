import test from 'ava'
import { rollup } from 'rollup'
import rollupConfig from '../examples/complex-web-worker/rollup.config.js'
import { createRollupMiddleware } from '../lib/koa-rollup.js'
import * as browser from './helpers/browser.js'
import * as server from './helpers/server.js'

async function buildExample({ context, log }) {
  log('Building example')
  const { output: outputOptions, ...inputOptions } = rollupConfig
  const bundle = await rollup(inputOptions)
  const { output } = await bundle.generate(outputOptions)
  Object.assign(context, { output })
}

async function installExample({ context, log }) {
  log('Installing example')
  const { app, output } = context
  app.use(createRollupMiddleware(output))
}

async function checkExample(t, page) {
  const { server } = t.context
  const { address, port } = server.address()
  const url = new URL(`http://${address}:${port}`)
  await page.goto(url)
  await page.waitForFunction(() => '_data' in window) // eslint-disable-line no-undef
  const { tests } = await page.evaluate('_data')
  const { expected, actual } = tests.find(test => test.name == t.title)
  t.is(actual, expected)
}

test.before(buildExample)
test.before(server.setup)
test.serial.before(installExample)
test.before(browser.setup)
test.after.always(browser.teardown)
test.after.always(server.teardown)

test('should generate an entry chunk', t => {
  const { output } = t.context
  const chunks = output.filter(file => file.type == 'chunk')
  const file = chunks.find(chunk => chunk.fileName == 'index.js')
  t.assert(file)
})
test('should generate a html asset', t => {
  const { output } = t.context
  const assets = output.filter(file => file.type == 'asset')
  const file = assets.find(asset => asset.fileName == 'index.html')
  t.assert(file)
})
test('should generate a worker asset', t => {
  const { output } = t.context
  const assets = output.filter(file => file.type == 'asset')
  const file = assets.find(asset => asset.name == 'worker.js')
  t.assert(file)
})
test('should generate a text asset', t => {
  const { output } = t.context
  const assets = output.filter(file => file.type == 'asset')
  const file = assets.find(asset => asset.name == 'asset.txt')
  t.assert(file)
})
test('static import should work', browser.giveNewPage, checkExample)
test('nested import should work', browser.giveNewPage, checkExample)
test('asset import should work', browser.giveNewPage, checkExample)
