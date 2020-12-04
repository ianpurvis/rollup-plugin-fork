// Example of a minimal plugin to support web workers.
// Resolves file names against `location` and transforms them into absolute
// urls for compatibility with `WindowOrWorkerGlobalScope.fetch`
export default ({ include }) => ({
  name: 'worker',
  resolveFileUrl({ chunkId, fileName }) {
    if (!include.test(chunkId)) return
    return `new URL(${JSON.stringify(fileName)}, location).href`
  }
})
