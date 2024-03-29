import {Piscina} from 'piscina'

const mergeWorkers = new Piscina({
  filename: new URL('worker.js', import.meta.url).href,
})

function mergeGeoJSONFiles(options) {
  return mergeWorkers.run(options)
}

export {mergeGeoJSONFiles}
