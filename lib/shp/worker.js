import {convert} from 'geojson2shp'
import schemas from './schemas.js'

export function shpWorker({srcPath, destPath, layer, targetCrs}, done) {
  convert(srcPath, destPath, {layer, targetCrs, schema: schemas[layer]})
    .then(result => done(null, result))
    .catch(error => done(error))
}
