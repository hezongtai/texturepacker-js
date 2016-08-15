'use strict'
const fs = require('fs')
const mkdirp = require('mkdirp')

const async = require('async')
const ProgressBar = require('progress')

const pack = require('../tp/packer')

const ACTION = ['idle', 'run', 'attack', 'damage', 'death', 'defence', 'skill_magic']

module.exports = (input, output, option, callback) => {
  readDir(input, output, `${option.npc}/${option.action}`, callback)
}

function readDir(root, output, path, callback) {
  fs.readdir(`${root}/${path}`, (err, files) => {
    if(err) throw err

    const bar = new ProgressBar('Packing sprites: [:bar] :current/:total :input -> :output', {
      total: files.length
    })

    async.eachSeries(files, (file, next) => {
      if(ACTION.indexOf(file) >= 0) {
        createSprite(root, output, {path: `${path}/${file}`, name: file}, next)

        const p = /([npc|companion])\/(.+)/.exec(path)[2]
        bar.tick({input: `${root}/${path}`, output: `${output}/${p}/${file}`})
      }else{
        next()
      }
    }, callback)
  })
}

function createSprite(root, output, options, next) {
  const p = /([npc|companion])\/(.+)/.exec(options.path)[2]
  mkdirp(`${output}/${p}`, err => {
    if(err) throw err
    mkdirp(`${output}/${p}/a`, error => {
      if(error) throw error
      pack(`${root}/${options.path}`, {output: `${output}/${p}`, name: options.name, hasAlpha: false}, next)
    })
  })
}
