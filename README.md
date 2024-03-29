[![build](https://github.com/ianpurvis/rollup-plugin-fork/actions/workflows/continuous.yml/badge.svg)](https://github.com/ianpurvis/rollup-plugin-fork/actions/workflows/continuous.yml)
[![codecov](https://codecov.io/gh/ianpurvis/rollup-plugin-fork/branch/trunk/graph/badge.svg?token=F5GZFK1VUN)](https://codecov.io/gh/ianpurvis/rollup-plugin-fork)

# rollup-plugin-fork

  A rollup plugin that spawns rollup, emitting the output back into the main bundle.


## Install

    $ npm i -D rollup-plugin-fork


## Options

### `include` [string] | [RegExp] | [string]\[\] | [RegExp]\[\]

  Regular expression or [picomatch] pattern that includes files.
  Nothing is included by default.

### `exclude` [string] | [RegExp] | [string]\[\] | [RegExp]\[\]

  Regular expression or [picomatch] pattern that excludes files.
  Nothing is excluded by default.

### `inputOptions` [InputOptions] | (options: [InputOptions]) => [InputOptions]

  Input options to be used when spawning rollup. By default, the plugin will
  inherit all options from the main bundle except for `input`.  You can
  specify an options object to be spread into the inherited options, or a
  transform function receiving the inherited options and returning their
  replacement.

  If a transform function is specified, it will be invoked for each module
  included by the plugin and will receive options where `input` is the absolute
  module path.  This can be used to drive transform logic, but note that
  modifying or deleting `input` will result in an error.

### `outputOptions` [OutputOptions] | (options: [OutputOptions]) => [OutputOptions]

  Output options to be used when spawning rollup. By default, the plugin will
  inherit all options from the main bundle except for `dir` and `file`.  You
  can specify an options object to be spread into the inherited options, or a
  transform function receiving the inherited options and returning their
  replacement.

  If you specify `dir`, it will be relative to the `dir` of the main output.

[RegExp]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
[String]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
[picomatch]: https://github.com/micromatch/picomatch#globbing-features
[InputOptions]: https://rollupjs.org/guide/en/#big-list-of-options
[OutputOptions]: https://rollupjs.org/guide/en/#big-list-of-options


## Web Worker Example

  The following example outputs an ES bundle with an IIFE web worker asset.
  `format` is overridden while `entryFileNames` is inherited to give the worker a
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

    import fork from 'rollup-plugin-fork'

    export default {
      input: 'main.js',
      output: {
        entryFileNames: '[name]-[hash].js'
        format: 'es'
      },
      plugins: [
        fork({
          include: /worker\.js$/,
          outputOptions: {
            format: 'iife'
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
