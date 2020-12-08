import { basename, join } from 'path'
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
    delete outputOptions.dir
    delete outputOptions.file

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
    const originalOutputOptions = outputOptions
    const originalInputOptions = inputOptions

    for (const remittee of remitted) {
      inputOptions = { ...originalInputOptions, input: remittee.input }
      outputOptions = { ...originalOutputOptions }

      ;({ inputOptions, outputOptions } =
        await remitOptions(inputOptions, outputOptions))

      const bundle = await rollup(inputOptions)
      const { output } = await bundle.generate(outputOptions)

      for (const file of output) {
        const fileName = join(outputOptions.dir || '', file.fileName)

        if (file.isEntry && file.facadeModuleId == remittee.input) {
          remittee.fileName = fileName
          this.setAssetSource(remittee.ref, file.code)
        } else {
          // delete isAsset before spreading to avoid deprecation warning
          delete file.isAsset
          this.emitFile({
            ...file,
            fileName,
            source: file.code || file.source,
            type: 'asset'
          })
        }
      }
    }
  }

  return { buildStart, load, name, outputOptions, renderStart }
}

export default createRemitPlugin
