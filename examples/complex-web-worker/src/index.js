import workerUrl from './worker.js'

const worker = new Worker(workerUrl)

worker.onmessage = ({ data }) => {
  document.body.innerText = JSON.stringify(data, null, 4)

  // Expose data for puppeteer:
  window._data = data
}
