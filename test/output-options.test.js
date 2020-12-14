import test from 'ava'
import { rollup } from 'rollup'
import fork from '../src/index.js'

const input = new URL('./fixtures/parent.js', import.meta.url).pathname


test('dir should not be inherited', async t => {
  let actualDir

  const options = {
    input,
    output: {
      dir: 'parent'
    },
    plugins: [
      fork({
        include: /child\.js$/,
        outputOptions(options) {
          actualDir = options.dir
        }
      })
    ]
  }
  const bundle = await rollup(options)
  const { output } = await bundle.generate(options.output)
  const [ parent, child ] = output

  t.is(actualDir, undefined)
  t.is(parent.fileName, 'parent.js')
  t.is(child.fileName, 'child.js')
})


test('dir should be prepended to all filenames', async t => {
  const options = {
    input,
    output: {
    },
    plugins: [
      fork({
        include: /child\.js$/,
        outputOptions: {
          dir: 'child'
        }
      })
    ]
  }
  const bundle = await rollup(options)
  const { output } = await bundle.generate(options.output)
  const [ parent, child ] = output

  t.is(parent.fileName, 'parent.js')
  t.is(child.fileName, 'child/child.js')
})


test('file should not be inherited', async t => {
  let actualFile

  const options = {
    input,
    output: {
      file: 'parent.js'
    },
    plugins: [
      fork({
        include: /child\.js$/,
        outputOptions(options) {
          actualFile = options.file
        }
      })
    ]
  }
  const bundle = await rollup(options)
  const { output } = await bundle.generate(options.output)
  const [ parent, child ] = output

  t.is(actualFile, undefined)
  t.is(parent.fileName, 'parent.js')
  t.is(child.fileName, 'child.js')
})


test('file should be used for the entry filename', async t => {
  const options = {
    input,
    output: {},
    plugins: [
      fork({
        include: /child\.js$/,
        outputOptions: {
          file: 'child.js'
        }
      })
    ]
  }
  const bundle = await rollup(options)
  const { output } = await bundle.generate(options.output)
  const [ parent, child ] = output

  t.is(parent.fileName, 'parent.js')
  t.is(child.fileName, 'child.js')
})


test('entryFileNames should be inherited', async t => {
  let actualEntryFileNames

  const options = {
    input,
    output: {
      entryFileNames: 'inherited-[name].js'
    },
    plugins: [
      fork({
        include: /child\.js$/,
        outputOptions(options) {
          actualEntryFileNames = options.entryFileNames
        }
      })
    ]
  }
  const bundle = await rollup(options)
  const { output } = await bundle.generate(options.output)
  const [ parent, child ] = output

  t.is(actualEntryFileNames, 'inherited-[name].js')
  t.is(parent.fileName, 'inherited-parent.js')
  t.is(child.fileName, 'inherited-child.js')
})


test('assetFileNames should be inherited', async t => {
  let actualAssetFileNames

  const options = {
    input,
    output: {
      assetFileNames: 'inherited-[name].[ext]'
    },
    plugins: [
      fork({
        include: /child\.js$/,
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
  const [ parent, child, asset ] = output

  t.is(parent.fileName, 'parent.js')
  t.is(child.fileName, 'child.js')
  t.is(asset.fileName, 'inherited-asset.txt')

  // Test wrapper function
  t.is(typeof actualAssetFileNames, 'function')

  const actualChildName = actualAssetFileNames({ name: 'child.js' })
  t.is(actualChildName, 'child.js')

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
      fork({
        include: /child\.js$/,
        inputOptions: {
          plugins: [{
            buildStart() {
              this.emitFile({
                id: new URL('./fixtures/static-import.js', import.meta.url).pathname,
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
  const [ parent, child, chunk ] = output

  t.is(actualChunkFileNames, 'inherited-[name].js')
  t.is(parent.fileName, 'parent.js')
  t.is(child.fileName, 'child.js')
  t.is(chunk.fileName, 'inherited-chunk.js')
})
