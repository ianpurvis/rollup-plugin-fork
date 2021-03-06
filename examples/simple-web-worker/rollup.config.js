import html from '@rollup/plugin-html'
import fork from '../../src/index.js'

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
    fork({
      include: /worker\.js$/,
      inputOptions: {
        plugins: []
      },
      outputOptions: {
        format: 'iife'
      }
    })
  ]
}
