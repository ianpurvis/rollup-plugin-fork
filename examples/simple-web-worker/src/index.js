import workerUrl from './worker.js'

new Worker(workerUrl).onmessage = ({ data }) => document.body.append(data)
