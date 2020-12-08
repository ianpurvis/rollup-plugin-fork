import test from 'ava'
import { rollup } from 'rollup'
import remit from '../src/remit.js'

const input = new URL('./fixtures/main.js', import.meta.url).pathname

test('output.file should not be inherited', async t => {
  let actualOutputFile

  const options = {
    input,
    output: {
      file: 'parent.js'
    },
    plugins: [
      remit({
        include: /remitted\.js$/,
        options(options) {
          actualOutputFile = options.output.file
        }
      })
    ]
  }
  const bundle = await rollup(options)
  const { output } = await bundle.generate(options.output)
  const [ main, remitted ] = output

  t.is(actualOutputFile, undefined)
  t.is(main.fileName, 'parent.js')
  t.is(remitted.fileName, 'remitted.js')
})

test('output.file should be used for the entry filename', async t => {
  const options = {
    input,
    output: {},
    plugins: [
      remit({
        include: /remitted\.js$/,
        options: {
          output: {
            file: 'child.js'
          }
        }
      })
    ]
  }
  const bundle = await rollup(options)
  const { output } = await bundle.generate(options.output)
  const [ main, remitted ] = output

  t.is(main.fileName, 'main.js')
  t.is(remitted.fileName, 'child.js')
})


test('output.entryFileNames should be inherited', async t => {
  let actualEntryFileNames

  const options = {
    input,
    output: {
      entryFileNames: 'inherited-[name].js'
    },
    plugins: [
      remit({
        include: /remitted\.js$/,
        options(options) {
          actualEntryFileNames = options.output.entryFileNames
        }
      })
    ]
  }
  const bundle = await rollup(options)
  const { output } = await bundle.generate(options.output)
  const [ main, remitted ] = output

  t.is(actualEntryFileNames, 'inherited-[name].js')
  t.is(main.fileName, 'inherited-main.js')
  t.is(remitted.fileName, 'inherited-remitted.js')
})
