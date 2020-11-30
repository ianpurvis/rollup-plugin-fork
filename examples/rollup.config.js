import html from '@rollup/plugin-html'
import remit from '../src/remit.js'
import asset from './plugins/asset.js'
import worker from './plugins/worker.js'
import indexTemplate from './src/index.html.js'

export default {
  input: 'src/index.js',
  output: {
    dir: 'dist',
    format: 'es'
  },
  plugins: [
    html({
      template: indexTemplate
    }),
    asset({
      include: /\.txt$/
    }),
    worker({
      include: /worker\.js$/,
    }),
    remit({
      include: /worker\.js$/,
      format: 'iife',
      inheritPlugins: {
        exclude: /html/
      },
      inline: true
    })
  ]
}
