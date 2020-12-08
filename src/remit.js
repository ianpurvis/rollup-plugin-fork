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
      const combined = { ...inputOptions, output: outputOptions }
      const { output = {}, ...input } = await options(combined) || combined
      inputOptions = input
      outputOptions = output
    } else {
      const { output = {}, ...input } = options
      inputOptions = { ...inputOptions, ...input }
      outputOptions = { ...outputOptions, ...output }
    }

    // Prevent runaway remits:
    const { plugins = [] } = inputOptions
    inputOptions.plugins = plugins.filter(p => p.name != name)

    return { inputOptions, outputOptions }
  }

  async function renderStart(outputOptions, inputOptions) {
    ({ inputOptions, outputOptions } =
      await remitOptions(inputOptions, outputOptions))

    for (const { input, name, ref } of remitted) {
      const bundle = await rollup({ ...inputOptions, input })
      const { output } = await bundle.generate({ ...outputOptions, name })
      const entry = output.find(file => file.type === 'chunk' && file.isEntry)
      // const localChunks = output.filter(file => file.type === 'chunk' && !file.isEntry)
      const assets = output.filter(file => file.type === 'asset')

      for (const asset of assets) {
        this.emitFile(asset)
      }

      this.setAssetSource(ref, entry.code)
    }
  }

  return { buildStart, load, name, outputOptions, renderStart }
}

export default createRemitPlugin
