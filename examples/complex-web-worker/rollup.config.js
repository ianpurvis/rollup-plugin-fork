import html from '@rollup/plugin-html'
import fork from '../../src/index.js'
import asset from './plugins/asset.js'
import worker from './plugins/worker.js'

const input = new URL('src/index.js', import.meta.url).pathname
const outputDir = new URL('dist', import.meta.url).pathname

export default {
  input,
  output: {
    dir: outputDir,
    format: 'es'
  },
  plugins: [
    html({
      // prevent @rollup/plugin-html from injecting non-entry js
      // see rollup/plugins#688
      template: () => `
<html>
  <head></head>
  <body><script type="module" src="index.js"></script></body>
</html>
`
    }),
    asset({
      include: /\.txt$/
    }),
    fork({
      include: /worker\.js$/,
      inputOptions({ plugins = [], ...options }) {
        return {
          ...options,
          plugins: [
            ...plugins.filter(plugin => plugin.name == 'asset'),
            worker()
          ]
        }
      },
      outputOptions(options) {
        return {
          ...options,
          format: 'iife'
        }
      }
    })
  ]
}
