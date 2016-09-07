'use strict'

const fs = require('fs')
const path = require('path')

const async = require('async')
const ProgressBar = require('progress')

const pack = require('../tp/texturepacker')
const crop = require('../tp/crop')

// generate spritesheets by vo
module.exports = function generate(config, cb) {
  const genList = []
  const alphaGenList = []

  const input = config.input
  const output = config.output
  const name = config.name

  const used = {}

  for(const wkey in config) {
    if(wkey === 'input' || wkey === 'output' || wkey === 'name') continue

    const actions = config[wkey]
    // console.log(actions)
    for(const akey in actions) {
      const action = actions[akey]

      const body = action.body
      const weapon = action.weapon
      const deco = action.deco

      // body
      checkImages(body)

      // weapon
      checkImages(weapon)

      // deco
      checkImages(deco)

      config[wkey][akey].frames = used[body]
      config[wkey][akey].body = (/(.+)(_a)$/).exec(body)[1]
    }
  }

  console.log(config)

  function checkImages(folder) {
    if(fs.statSync(`${input}/${name}/${folder}`).isDirectory()) {
      if(!used[folder]) {
        const alpha = (/(.+)(_a)$/).exec(folder)
        if(alpha) {
          // if it has alpha channel images already, pack them both
          genList.push({iDir: `${input}/${name}/${folder}`, oDir: `${output}/${name}`, name: folder})
          // genList.push({iDir: `${input}/${name}/${alpha[1]}`, oDir: `${output}/${name}`, name: alpha[1]})
        }else{
          // if not, make the alpha channel images first
          alphaGenList.push({iDir: `${input}/${name}/${folder}`, oDir: `${input}/${name}/${folder}_a`, name: `${folder}_a`})
          genList.push({iDir: `${input}/${name}/${folder}_a`, oDir: `${output}/${name}`, name: `${folder}_a`})
        }

        used[folder] = findImages(fs.readdirSync(`${input}/${name}/${folder}`))
      }
    }else{
      throw new Error(`Folder not exist:${folder}`)
    }
  }

  function findImages(images) {
    const files = []
    images.forEach(image => {
      if(path.extname(image).toLowerCase() === '.png') files.push(path.basename(image, '.png'))
    })

    return files
  }

  // now pack the images
  const bar = new ProgressBar('Packing sprites: [:bar] :current/:total :input -> :output', {
    total: genList.length
  })

  async.waterfall([
    cb => {
      async.eachSeries(genList, (io, next) => {
        pack(io.iDir, {output: io.oDir, character: name, name: io.name, genAlpha: false}, next)
        bar.tick({input: io.iDir, output: io.oDir})
      }, cb)
    },
    cb => {
      crop(genList, cb)
    },
    cb => {
      fs.writeFileSync(`${output}/${name}/config.json`, JSON.stringify(config, null, 2))
      cb()
    }
  ])
}
