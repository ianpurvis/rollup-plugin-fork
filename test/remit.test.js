import test from 'ava'
import { rollup } from 'rollup'
import remit from '../src/remit.js'

const input = new URL('./fixtures/main.js', import.meta.url).pathname

test('remit deduplicates emitted assets', async t => {
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
      remit({
        include: /remitted\.js$/
      })
    ]
  }
  const bundle = await rollup(options)
  await bundle.generate(options.output)

  t.is(actualWarning, undefined)
})
