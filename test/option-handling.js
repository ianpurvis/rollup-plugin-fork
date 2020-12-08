import test from 'ava'
import { rollup } from 'rollup'
import remit from '../src/remit.js'

const input = new URL('./fixtures/main.js', import.meta.url).pathname


test('output.dir should not be inherited', async t => {
  let actualOutputDir

  const options = {
    input,
    output: {
      dir: 'parent'
    },
    plugins: [
      remit({
        include: /remitted\.js$/,
        options(options) {
          actualOutputDir = options.output.dir
        }
      })
    ]
  }
  const bundle = await rollup(options)
  const { output } = await bundle.generate(options.output)
  const [ main, remitted ] = output

  t.is(actualOutputDir, undefined)
  t.is(main.fileName, 'main.js')
  t.is(remitted.fileName, 'remitted.js')
})


test('output.dir should be prepended to all filenames', async t => {
  const options = {
    input,
    output: {
    },
    plugins: [
      remit({
        include: /remitted\.js$/,
        options: {
          output: {
            dir: 'child'
          }
        }
      })
    ]
  }
  const bundle = await rollup(options)
  const { output } = await bundle.generate(options.output)
  const [ main, remitted ] = output

  t.is(main.fileName, 'main.js')
  t.is(remitted.fileName, 'child/remitted.js')
})


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


test('input should be the full path of the remitted file', async t => {
  const expectedInput = new URL('./fixtures/remitted.js', import.meta.url).pathname
  let actualInput

  const options = {
    input,
    output: {
      file: 'parent.js'
    },
    plugins: [
      remit({
        include: /remitted\.js$/,
        options(options) {
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
  const expectedInput = new URL('./fixtures/remitted.js', import.meta.url).pathname
  const expectedError = {
    code: 'PLUGIN_ERROR',
    message: `Remit plugin options must not modify the value of "input". Expected "${expectedInput}" but was "mutated.js"`
  }

  const options = {
    input,
    output: {},
    plugins: [
      remit({
        include: /remitted\.js$/,
        options: {
          input: 'mutated.js'
        },
      })
    ]
  }
  const bundle = await rollup(options)

  await t.throwsAsync(bundle.generate(options.output), expectedError)
})


test('plugins should not inherit remit', async t => {
  let actualPlugins

  const options = {
    input,
    output: {
      file: 'parent.js'
    },
    plugins: [
      remit({
        include: /remitted\.js$/,
        options(options) {
          actualPlugins = options.plugins
        }
      })
    ]
  }
  const bundle = await rollup(options)
  await bundle.generate(options.output)

  t.deepEqual(actualPlugins, [])
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


test('output.assetFileNames should be inherited', async t => {
  let actualAssetFileNames

  const options = {
    input,
    output: {
      assetFileNames: 'inherited-[name].[ext]'
    },
    plugins: [
      remit({
        include: /remitted\.js$/,
        options(options) {
          actualAssetFileNames = options.output.assetFileNames
          return {
            ...options,
            plugins: [{
              generateBundle() {
                this.emitFile({ name: 'asset.txt', source: '', type: 'asset' })
              }
            }]
          }
        }
      })
    ]
  }
  const bundle = await rollup(options)
  const { output } = await bundle.generate(options.output)
  const [ main, remitted, asset ] = output

  t.is(main.fileName, 'main.js')
  t.is(remitted.fileName, 'remitted.js')
  t.is(asset.fileName, 'inherited-asset.txt')

  // Test wrapper function
  t.is(typeof actualAssetFileNames, 'function')

  const actualRemittedName = actualAssetFileNames({ name: 'remitted.js' })
  t.is(actualRemittedName, 'remitted.js')

  const actualAssetName = actualAssetFileNames({ name: 'asset.txt' })
  t.is(actualAssetName, 'inherited-[name].[ext]')
})


test('output.chunkFileNames should be inherited', async t => {
  let actualChunkFileNames

  const options = {
    input,
    output: {
      chunkFileNames: 'inherited-[name].js',
    },
    plugins: [
      remit({
        include: /remitted\.js$/,
        options(options) {
          actualChunkFileNames = options.output.chunkFileNames
          return {
            ...options,
            plugins: [{
              buildStart() {
                this.emitFile({
                  id: new URL('./fixtures/remitted-static-import.js', import.meta.url).pathname,
                  name: 'chunk',
                  code: 'export default "NOT_EMPTY"',
                  type: 'chunk'
                })
              }
            }]
          }
        }
      })
    ]
  }
  const bundle = await rollup(options)
  const { output } = await bundle.generate(options.output)
  const [ main, remitted, chunk ] = output

  t.is(actualChunkFileNames, 'inherited-[name].js')
  t.is(main.fileName, 'main.js')
  t.is(remitted.fileName, 'remitted.js')
  t.is(chunk.fileName, 'inherited-chunk.js')
})