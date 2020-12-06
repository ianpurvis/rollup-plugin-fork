import { basename } from 'path'
import { rollup } from 'rollup'
import { createFilter } from '@rollup/pluginutils'

function pathname(id) {
  return new URL(id, 'file:///').pathname
}

function createRemitPlugin({
  exclude,
  include,
  options = {}
} = {}) {

  const name = 'remit'
  const remitted = []
  const filter = createFilter(include, exclude, { resolve: false })

  function buildStart() {
    remitted.length = 0
  }

  function load(id) {
    if (!filter(id)) return
    const input = pathname(id)
    const name = basename(input)
    const ref = this.emitFile({ name, type: 'asset' })
    const fileUrl = `import.meta.ROLLUP_FILE_URL_${ref}`
    remitted.push({ id, input, name, ref, fileUrl })
    return `export default ${fileUrl}`
  }

  function outputOptions({
    // filename functions cannot return undefined.
    // re-create rollup defaults as a workaround:
    assetFileNames = 'assets/[name]-[hash][extname]',
    chunkFileNames = '[name]-[hash].js',
    ...options
  }) {
    return {
      assetFileNames(assetInfo) {
        for (const { name } of remitted) {
          if (assetInfo.name == name) {
            return chunkFileNames
          }
        }
        return assetFileNames
      },
      chunkFileNames,
      ...options,
    }
  }

  async function remitOptions(inputOptions, outputOptions) {
    if (typeof options === 'function') {
      ({ output: outputOptions, ...inputOptions } =
        await options({ ...inputOptions, output: outputOptions }))
    } else {
      inputOptions = { ...inputOptions, ...options }
      outputOptions = { ...outputOptions, ...options.output }
    }

    // Prevent runaway remits:
    inputOptions.plugins = inputOptions.plugins.filter(p => p.name != name)

    return { inputOptions, outputOptions }
  }

  async function renderStart(outputOptions, inputOptions) {
    ({ inputOptions, outputOptions } =
      await remitOptions(inputOptions, outputOptions))

    for (const { input, name, ref } of remitted) {
      const localInputOptions = { ...inputOptions, input }
      const localOutputOptions = { ...outputOptions, name }
      const localBundle = await rollup(localInputOptions)
      const { output } = await localBundle.generate(localOutputOptions)
      const localEntry = output.find(file => file.type === 'chunk' && file.isEntry)
      // const localChunks = output.filter(file => file.type === 'chunk' && !file.isEntry)
      const localAssets = output.filter(file => file.type === 'asset')

      for (const asset of localAssets) {
        this.emitFile(asset)
      }

      this.setAssetSource(ref, localEntry.code)
    }
  }

  return { buildStart, load, name, outputOptions, renderStart }
}

export default createRemitPlugin
