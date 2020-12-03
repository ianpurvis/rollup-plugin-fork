import workerUrl from './worker.js'

const worker = new Worker(workerUrl)

worker.onmessage = ({ data }) => {
  document.body.innerHTML =
    `<pre>${JSON.stringify(data, null, 4)}</pre>`

  // Expose data for puppeteer:
  window._data = data
}
