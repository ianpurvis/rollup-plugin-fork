// Example of a minimal plugin to support web workers.
// Resolves file paths against `location` and transforms them into absolute
// urls for compatibility with `WindowOrWorkerGlobalScope.fetch`
export default () => ({
  name: 'worker',
  resolveFileUrl({ relativePath }) {
    return `new URL(${JSON.stringify(relativePath)}, location).href`
  }
})
