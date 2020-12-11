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
  const filter = createFilter(include, exclude, { resolve: false })
  const forks = []

  function buildStart() {
    forks.length = 0
  }

  function load(id) {
    if (!filter(id)) return
    const input = pathname(id)
    const name = basename(input)
    const ref = this.emitFile({ name, type: 'asset' })
    forks.push({ id, input, name, ref })
    return `export default import.meta.ROLLUP_FILE_URL_${ref}`
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
        for (const { name, fileName } of forks) {
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
    for (const fork of forks) {
      const { input } = fork
      fork.inputOptions = await inheritInputOptions({ ...inputOptions, input })
      fork.outputOptions = await inheritOutputOptions(outputOptions)
    }

    for (const fork of forks) {
      const { input, inputOptions, outputOptions, ref } = fork
      const bundle = await rollup(inputOptions)
      const { output } = await bundle.generate(outputOptions)

      const { dir = '' } = outputOptions
      for (const file of output) {
        file.fileName = join(dir, file.fileName)
      }

      for (const { fileName, facadeModuleId, code } of output) {
        if (facadeModuleId == input) {
          fork.fileName = fileName
          this.setAssetSource(ref, code)
        }
      }

      fork.output = output
    }
  }

  function generateBundle(_, bundle) {
    for (const { output } of forks) {
      for (const { fileName, name, code, source } of output) {
        const existing = bundle[fileName]

        // If file already exists but is not an asset with the same source,
        // emit the incoming file to trigger a FILE_NAME_CONFLICT warning.
        if (!existing || existing.source != (code||source)) {
          this.emitFile({ fileName, name, source: code||source, type: 'asset' })
        }
      }
    }
  }

  return { buildStart, load, name, outputOptions, renderStart, generateBundle }
}

export default createRemitPlugin
