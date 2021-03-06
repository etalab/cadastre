'use strict'

const {EventEmitter} = require('events')

const workerFarm = require('worker-farm')
const bluebird = require('bluebird')

const {Tree} = require('../dist/pci')

const workerOptions = {execArgv: ['--max-old-space-size=3072']}

const extractCommuneWorkers = workerFarm(
  {maxConcurrentCallsPerWorker: 1, maxRetries: 0, workerOptions},
  require.resolve('./worker')
)

function extractDepartement(basePath, codeDep) {
  const extractor = new EventEmitter()
  const edigeoTree = new Tree(basePath, 'dgfip-pci-vecteur', 'edigeo')

  extractor.extracted = 0

  function progress({codeCommune}) {
    extractor.extracted++
    extractor.emit('commune', {codeCommune})
  }

  edigeoTree.listCommunesByDepartement(codeDep)
    .then(communesFound => {
      /* Progression */
      extractor.total = communesFound.length

      // Series since GDAL is a blocking binding
      return bluebird.map(communesFound, commune => {
        return new Promise((resolve, reject) => {
          extractCommuneWorkers({basePath, codeCommune: commune}, err => {
            if (err) {
              console.error('Unable to extract commune %s', commune)
              console.error(err)
              return reject(err)
            }

            progress({codeCommune: commune})
            resolve()
          })
        })
      })
    })
    .then(() => extractor.emit('end'))
    .catch(error => extractor.emit('error', error))

  return extractor
}

function stopWorkers(cb) {
  workerFarm.end(extractCommuneWorkers, cb)
}

module.exports = {extractDepartement, stopWorkers}
