import test from 'ava'
import { rollup } from 'rollup'
import fork from '../src/index.js'

const input = new URL('./fixtures/parent.js', import.meta.url).pathname

test('should not emit duplicate files', async t => {
  let actualWarning

  const options = {
    input,
    onwarn(warning) {
      actualWarning = warning
    },
    output: {
      file: 'parent.js'
    },
    plugins: [
      {
        generateBundle() {
          this.emitFile({
            type: 'asset',
            fileName: 'asset.txt',
            source: '🍄'
          })
        }
      },
      fork({
        include: /child\.js$/
      })
    ]
  }
  const bundle = await rollup(options)
  await bundle.generate(options.output)

  t.is(actualWarning, undefined)
})


test('should warn if overwriting an existing file with different content', async t => {
  let actualWarning

  const options = {
    input,
    onwarn(warning) {
      actualWarning = warning
    },
    output: {
      file: 'parent.js'
    },
    plugins: [
      {
        generateBundle() {
          this.emitFile({
            type: 'asset',
            fileName: 'asset.txt',
            source: '🍄'
          })
        }
      },
      fork({
        include: /child\.js$/,
        inputOptions: {
          plugins: [{
            generateBundle() {
              this.emitFile({
                type: 'asset',
                fileName: 'asset.txt',
                source: '👞'
              })
            }
          }]
        }
      })
    ]
  }
  const bundle = await rollup(options)
  await bundle.generate(options.output)

  t.assert(actualWarning)
  t.is(actualWarning.code, 'FILE_NAME_CONFLICT')
  t.is(actualWarning.message, 'The emitted file "asset.txt" overwrites a previously emitted file of the same name.')
})
