module.exports = {
  env: {
    es2020: true,
    node: true
  },
  extends: [
    'eslint:recommended'
  ],
  ignorePatterns: [
    'dist',
    'node_modules'
  ],
  overrides: [
    {
      files: [
        'examples/src/**/*.js',
      ],
      env: {
        browser: true,
        es2020: true
      },
    },
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  rules: {
    indent: [ 'error', 2 ],
    'linebreak-style': [ 'error', 'unix' ],
    quotes: [ 'error', 'single' ],
    semi: [ 'error', 'never' ]
  }
}
