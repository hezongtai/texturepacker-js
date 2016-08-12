'use strict'

const async = require('async')
const ProgressBar = require('progress')

const pack = require('../tp/packer')

// generate spritesheets by vo
module.exports = function generate(file, vo, cb) {
  // generate body's spritesheet
  const genList = []

  const PATH = vo.PATH
  const PATH_OUTPUT = vo.PATH_OUTPUT

  // body
  for(const key in vo.body) {
    const hasAlpha = true // only body has alpha channel
    const reg = /(.+)(_a)$/

    const oDir = `${PATH_OUTPUT}/role_${file}/@body` // output dir
    const iDir = `${PATH}/${file}/${reg.exec(vo.body[key])[1]}` // input dir

    genList.push({iDir, oDir, name: key, hasAlpha})
  }

  // weapon
  for(const key in vo.weapon) {
    const o = `${PATH_OUTPUT}/role_${file}/weapon/@${key}`

    for(const action in vo.weapon[key]) {
      const hasAlpha = false

      const iDir = `${PATH}/${file}/${vo.weapon[key][action]}` // input dir
      const oDir = `${o}` // output dir

      genList.push({iDir, oDir, name: action, hasAlpha}) // action name is the file name
    }
  }

  // deco
  for(const key in vo.avatar.decoration) {
    const hasAlpha = false

    const oDir = `${PATH_OUTPUT}/role_${file}/@avatar/_decoration` // output dir
    const iDir = `${PATH}/${file}/${vo.avatar.decoration[key]}` // input dir

    genList.push({iDir, oDir, name: key, hasAlpha})
  }

  const bar = new ProgressBar('Packing sprites: [:bar] :current/:total :input -> :output', {
    total: genList.length
  })

  async.eachSeries(genList, (io, next) => {
    pack(io.iDir, {output: io.oDir, name: io.name, hasAlpha: io.hasAlpha}, next)
    bar.tick({input: io.iDir, output: io.oDir})
  }, cb)
}
