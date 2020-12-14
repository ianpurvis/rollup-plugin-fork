export default {
  input: 'src/index.js',
  external: [
    'path',
    'rollup',
    '@rollup/pluginutils'
  ],
  output: [{
    exports: 'default',
    file: 'dist/rollup-plugin-fork.cjs',
    format: 'cjs'
  },{
    file: 'dist/rollup-plugin-fork.mjs',
    format: 'esm'
  }]
}
