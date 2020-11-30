import staticImport from './static-import.js'
import nestedImport from './nested-import.js'
import assetImport from '../assets/asset.txt'

async function run() {
  const title = "Web Worker Example"
  const tests = []

  tests.push({
    name: 'static import should work',
    expected: 'STATIC IMPORT',
    actual: staticImport
  })

  tests.push({
    name: 'nested import should work',
    expected: 'NESTED STATIC IMPORT',
    actual: nestedImport
  })

  const assetResponse = await fetch(assetImport)
  const assetContent = await assetResponse.text()
  tests.push({
    name: 'asset import should work',
    expected: 'ASSET',
    actual: assetContent
  })

  return { title, tests }
}

run().then(postMessage)
