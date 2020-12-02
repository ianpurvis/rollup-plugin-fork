// Example of a minimal plugin to support web workers.  Resolves file urls
// against `WindowOrWorkerGlobalScope.origin` and ensures they are absolute for
// `WindowOrWorkerGlobalScope.fetch`
export default ({ include }) => ({
  name: 'worker',
  resolveFileUrl({ chunkId, fileName }) {
    if (!include.test(chunkId)) return
    return `new URL(${JSON.stringify(fileName)}, origin).href`
  }
})
