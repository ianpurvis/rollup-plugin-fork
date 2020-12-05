import workerUrl from './worker.js'

new Worker(workerUrl).onmessage = ({ data }) => {
  document.body.innerHTML = data

  // Expose data for puppeteer:
  window._data = data
}
