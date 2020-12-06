// Example of a minimal plugin to support web workers.
// Resolves file names against `location` and transforms them into absolute
// urls for compatibility with `WindowOrWorkerGlobalScope.fetch`
export default () => ({
  name: 'worker',
  resolveFileUrl({ fileName }) {
    return `new URL(${JSON.stringify(fileName)}, location).href`
  }
})
