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

  function outputOptions(options) {
    // Unconfigured `assetFileNames` will be undefined here because the default
    // value does not get injected until after all `outputOptions` hooks are
    // complete.  Since the remit wrapper function must not return undefined,
    // re-create the documented default value:
    const { assetFileNames = 'assets/[name]-[hash][extname]' } = options

    return {
      ...options,
      assetFileNames(assetInfo) {
        for (const { name, fileName } of remitted) {
          if (assetInfo.name == name) {
            return fileName
          }
        }
        return assetFileNames
      }
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

    for (const remittee of remitted) {
      const bundle = await rollup({ ...inputOptions, input: remittee.input })
      const { output } = await bundle.generate({ ...outputOptions, name: remittee.name })
      const entry = output.find(file => file.type === 'chunk' && file.isEntry)
      // const localChunks = output.filter(file => file.type === 'chunk' && !file.isEntry)
      const assets = output.filter(file => file.type === 'asset')

      for (const asset of assets) {
        this.emitFile(asset)
      }

      remittee.fileName = entry.fileName
      this.setAssetSource(remittee.ref, entry.code)
    }
  }

  return { buildStart, load, name, outputOptions, renderStart }
}

export default createRemitPlugin
