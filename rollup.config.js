export default {
  input: 'src/remit.js',
  external: [
    'path',
    'rollup',
    '@rollup/pluginutils'
  ],
  output: [{
    exports: 'default',
    file: 'dist/remit.cjs',
    format: 'cjs'
  },{
    file: 'dist/remit.mjs',
    format: 'esm'
  }]
}
