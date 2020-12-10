import test from 'ava'
import { rollup } from 'rollup'
import remit from '../src/remit.js'

const input = new URL('./fixtures/main.js', import.meta.url).pathname


test('dir should not be inherited', async t => {
  let actualDir

  const options = {
    input,
    output: {
      dir: 'parent'
    },
    plugins: [
      remit({
        include: /remitted\.js$/,
        outputOptions(options) {
          actualDir = options.dir
        }
      })
    ]
  }
  const bundle = await rollup(options)
  const { output } = await bundle.generate(options.output)
  const [ main, remitted ] = output

  t.is(actualDir, undefined)
  t.is(main.fileName, 'main.js')
  t.is(remitted.fileName, 'remitted.js')
})


test('dir should be prepended to all filenames', async t => {
  const options = {
    input,
    output: {
    },
    plugins: [
      remit({
        include: /remitted\.js$/,
        outputOptions: {
          dir: 'child'
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


test('file should not be inherited', async t => {
  let actualFile

  const options = {
    input,
    output: {
      file: 'parent.js'
    },
    plugins: [
      remit({
        include: /remitted\.js$/,
        outputOptions(options) {
          actualFile = options.file
        }
      })
    ]
  }
  const bundle = await rollup(options)
  const { output } = await bundle.generate(options.output)
  const [ main, remitted ] = output

  t.is(actualFile, undefined)
  t.is(main.fileName, 'parent.js')
  t.is(remitted.fileName, 'remitted.js')
})


test('file should be used for the entry filename', async t => {
  const options = {
    input,
    output: {},
    plugins: [
      remit({
        include: /remitted\.js$/,
        outputOptions: {
          file: 'child.js'
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


test('entryFileNames should be inherited', async t => {
  let actualEntryFileNames

  const options = {
    input,
    output: {
      entryFileNames: 'inherited-[name].js'
    },
    plugins: [
      remit({
        include: /remitted\.js$/,
        outputOptions(options) {
          actualEntryFileNames = options.entryFileNames
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


test('assetFileNames should be inherited', async t => {
  let actualAssetFileNames

  const options = {
    input,
    output: {
      assetFileNames: 'inherited-[name].[ext]'
    },
    plugins: [
      remit({
        include: /remitted\.js$/,
        inputOptions: {
          plugins: [{
            generateBundle() {
              this.emitFile({ name: 'asset.txt', source: '', type: 'asset' })
            }
          }]
        },
        outputOptions(options) {
          actualAssetFileNames = options.assetFileNames
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


test('chunkFileNames should be inherited', async t => {
  let actualChunkFileNames

  const options = {
    input,
    output: {
      chunkFileNames: 'inherited-[name].js',
    },
    plugins: [
      remit({
        include: /remitted\.js$/,
        inputOptions: {
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
        },
        outputOptions(options) {
          actualChunkFileNames = options.chunkFileNames
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
