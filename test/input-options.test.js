import test from 'ava'
import { rollup } from 'rollup'
import fork from '../src/index.js'

const input = new URL('./fixtures/parent.js', import.meta.url).pathname


test('input should be the full path to the fork input', async t => {
  const expectedInput = new URL('./fixtures/child.js', import.meta.url).pathname
  let actualInput

  const options = {
    input,
    output: {
      file: 'parent.js'
    },
    plugins: [
      fork({
        include: /child\.js$/,
        inputOptions(options) {
          actualInput = options.input
        }
      })
    ]
  }
  const bundle = await rollup(options)
  await bundle.generate(options.output)

  t.is(actualInput, expectedInput)
})

test('modifying input results in an error', async t => {
  const expectedInput = new URL('./fixtures/child.js', import.meta.url).pathname
  const expectedError = {
    code: 'PLUGIN_ERROR',
    message: 'Forked inputOptions may not overwrite "input" ' +
      `(expected "${expectedInput}" but was "mutated.js")`
  }

  const options = {
    input,
    output: {},
    plugins: [
      fork({
        include: /child\.js$/,
        inputOptions: {
          input: 'mutated.js'
        },
      })
    ]
  }
  const bundle = await rollup(options)

  await t.throwsAsync(bundle.generate(options.output), expectedError)
})


test('plugins should not inherit fork', async t => {
  let actualPlugins

  const options = {
    input,
    output: {
      file: 'parent.js'
    },
    plugins: [
      fork({
        include: /child\.js$/,
        inputOptions(options) {
          actualPlugins = options.plugins
        }
      })
    ]
  }
  const bundle = await rollup(options)
  await bundle.generate(options.output)

  t.deepEqual(actualPlugins, [])
})
