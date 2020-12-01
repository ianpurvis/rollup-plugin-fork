import mime from 'mime-types'

function createRollupMiddleware(rollupOutput) {
  return function(ctx) {
    const fileName = ctx.path.replace(/\/$/, `/index.html`).slice(1)
    const file = rollupOutput.find(file => file.fileName == fileName)
    ctx.assert(file, 404)
    ctx.type = mime.lookup(fileName)
    ctx.body = file.code || file.source
  }
}

export { createRollupMiddleware }
