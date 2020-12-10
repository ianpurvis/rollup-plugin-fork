import { basename, join } from 'path'
import { rollup } from 'rollup'
import { createFilter } from '@rollup/pluginutils'

function pathname(id) {
  return new URL(id, 'file:///').pathname
}

function createRemitPlugin({
  exclude,
  include,
  inputOptions: remitInputOptions = {},
  outputOptions: remitOutputOptions = {}
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

  async function inheritInputOptions({ ...options }) {
    // Prevent runaway remits:
    const { plugins = [] } = options
    options.plugins = plugins.filter(p => p.name != name)

    const { input: expectedInput } = options

    if (typeof remitInputOptions === 'function') {
      options = await remitInputOptions(options) || options
    } else {
      options = { ...options, ...remitInputOptions }
    }

    if (options.input !== expectedInput) {
      throw new Error('Remit plugin options must not modify the value of "input".' +
        ` Expected ${JSON.stringify(expectedInput)} but was ${JSON.stringify(options.input)}`)
    }

    return options
  }

  async function inheritOutputOptions({ ...options }) {
    delete options.dir
    delete options.file

    if (typeof remitOutputOptions === 'function') {
      options = await remitOutputOptions(options) || options
    } else {
      options = { ...options, ...remitOutputOptions }
    }

    return options
  }

  async function renderStart(outputOptions, inputOptions) {
    for (const remittee of remitted) {
      const localInputOptions =
        await inheritInputOptions({ ...inputOptions, input: remittee.input })
      const localOutputOptions = await inheritOutputOptions(outputOptions)
      const bundle = await rollup(localInputOptions)
      const { output } = await bundle.generate(localOutputOptions)

      for (const file of output) {
        const fileName = join(localOutputOptions.dir || '', file.fileName)

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
