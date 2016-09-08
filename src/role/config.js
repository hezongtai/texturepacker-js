'use strict'

const fs = require('fs')
const async = require('async')

const xlsx = require('xlsx')
const sheet = require('./sheet')

let PATH = ''
let PATH_OUTPUT = ''

module.exports = (file, input, output, next) => {
  PATH = input
  PATH_OUTPUT = output

  async.waterfall([
    cb => {
      createCharacterDir(file, cb) // create the main folder to hold the character's sprite sheets
    },
    cb => {
      readConfig(file, cb)
    },
    (config, cb) => {
      this.config = config
      saveConfig(file, config, cb)
    }
  ], () => {
    next(this.config)
  })
}

// make character's output dir
function createCharacterDir(file, cb) {
  const outputDir = `${PATH_OUTPUT}/${file}`
  try{
    fs.accessSync(outputDir)
  }catch(err) {
    fs.mkdirSync(outputDir)
  }

  cb()
}

// parsing config
function readConfig(file, cb) {
  const configPath = `${PATH}/${file}/config.xlsx`
  try{
    fs.accessSync(configPath)
    const wb = xlsx.readFile(configPath)
    const res = sheet(wb.Sheets[wb.SheetNames[0]])
    cb(null, res)
  }catch(err) {
    throw err
  }
}

// save the config
function saveConfig(file, config, cb) {
  fs.writeFile(`${PATH_OUTPUT}/${file}/config.json`, JSON.stringify(config, null, 2), err => {
    if(err) throw err
    cb()
  })
}
