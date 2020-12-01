![continuous](https://github.com/ianpurvis/rollup-plugin-remit/workflows/continuous/badge.svg)

# rollup-plugin-remit

  A rollup plugin that spawns rollup, emitting the output back into the main build.


## Install

    $ npm i -D rollup-plugin-remit


## Options

### `include` [string] | [RegExp] | [string]\[\] | [RegExp]\[\]

  Regular expression or [picomatch] pattern that includes files. Nothing is included by default.

### `exclude` [string] | [RegExp] | [string]\[\] | [RegExp]\[\]

  Regular expression or [picomatch] pattern that excludes files. Nothing is excluded by default.

### `options` [RollupOptions] | (options: [RollupOptions]) => [RollupOptions]

  Rollup options to be used for the remit. By default, the plugin will inherit
  all options from the main build except for `input`, `output.dir` and
  `output.file`.  You can specify an options object to be spread into the
  inherited options, or a transform function receiving the inherited options and
  returning their replacement.

  If a transform function is specified, it will be invoked for each module
  matching the plugin's `include` pattern and will receive options where `input`
  is the full path of the module being remitted. This might be used to drive
  transform logic, but note that deleting or modifying `input` will result in an
  error.

  If you specify `output.dir` as a remit option, it will be relative to the
  `output.dir` of the main build.

[RegExp]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
[String]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
[picomatch]: https://github.com/micromatch/picomatch#globbing-features
[RollupOptions]: https://rollupjs.org/guide/en/#big-list-of-options


## Web Worker Example

  The following example re-emits an IIFE web worker bundle.  `format` is
  overridden while `output.entryFileNames` is inherited to give the worker a
  hashed file name.

  **main.js**

    import workerUrl from './worker.js'

    new Worker(workerUrl).onmessage = ({ data }) => document.body.append(data)
 

  **worker.js**

    import hello from './helper.js'

    postMessage(hello)


  **helper.js**
  
    export default '👋'

 
  **rollup.config.js**

    import remit from 'rollup-plugin-remit'

    export default {
      input: 'main.js',
      output: {
        entryFileNames: '[name]-[hash].js'
        format: 'es'
      },
      plugins: [
        remit({
          include: /worker\.js$/,
          options: {
            output: {
              format: 'iife'
            }
          }
        })
      ]
    }


  **output:**

    $ npx rollup -c

    main.js → stdout...

    //→ main-78fc96ad.js:
    var workerUrl = new URL('worker-0f27d5dd.js', import.meta.url).href;

    new Worker(workerUrl).onmessage = ({ data }) => document.body.append(data);

    //→ worker-0f27d5dd.js:
    (function () {
      'use strict';

      var hello = '👋';

      postMessage(hello);

    }());


## License

  This package is available as open source under the terms of the
  [MIT License](http://opensource.org/licenses/MIT).


[![https://purvisresearch.com](.logo.svg)](https://purvisresearch.com)
