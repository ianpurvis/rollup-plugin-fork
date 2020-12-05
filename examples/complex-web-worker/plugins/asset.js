import { readFile } from 'fs/promises'
import { basename } from 'path'

// Example of a minimal plugin to support assets.
export default ({ include }) => ({
  name: 'asset',
  async load(id) {
    if (!include.test(id)) return
    const name = basename(id)
    const source = await readFile(id)
    const ref = this.emitFile({ type: 'asset', name, source })
    return `export default import.meta.ROLLUP_FILE_URL_${ref}`
  }
})
