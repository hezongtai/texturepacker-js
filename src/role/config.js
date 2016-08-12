'use strict'

const fs = require('fs')
const async = require('async')

const xlsx = require('xlsx')
const sheet = require('./sheet')

let PATH = ''
let PATH_OUTPUT = ''

const WEAPON_ID = {
  sword: 1,
  spear: 2,
  axe: 3,
  bow: 4,
  staff: 5,
  fist: 6
}

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
      genNewVO(file, config, cb)
    },
    (vo, cb) => {
      createFolders(file, vo, cb)
    }
  ], (caller, vo) => {
    vo.PATH = PATH
    vo.PATH_OUTPUT = PATH_OUTPUT

    next(null, vo)
  })
}

const hasOwnProperty = Object.prototype.hasOwnProperty
function isEmpty(obj) {
  if (obj === null) {
    return true
  }

  if (obj.length > 0) {
    return false
  }

  if (obj.length === 0) {
    return true
  }

  for (const key in obj) {
    if (hasOwnProperty.call(obj, key)) {
      return false
    }
  }

  return true
}
// make character's output dir
function createCharacterDir(file, cb) {
  const outputDir = `${PATH_OUTPUT}/role_${file}`
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

// generates new structs for unity
function genNewVO(file, config, cb) {
  const newVO = {}

  newVO.weapon = {} // create a weapon obj to hold all weapon's sprites
  newVO.body = {} // create a body obj to hold all weapon's sprites
  newVO.avatar = {} // create a avartar obj to hold all avartar's sprites
  newVO.avatar.decoration = {} // create a decoration obj to hold all decoration's sprites

  for(const key in config) {
    newVO.weapon[WEAPON_ID[key]] = {}
    for(const action in config[key]) {
      const aVO = config[key][action]
      newVO.weapon[WEAPON_ID[key]][action] = aVO.weapon
    }
  }

  const body = {}
  const decorations = {}

  for(const key in config) {
    const weaponNum = WEAPON_ID[key]
    // weapon
    newVO.weapon[weaponNum] = {}
    for(const action in config[key]) {
      const aVO = config[key][action]
      newVO.weapon[weaponNum][action] = aVO.weapon
    }

    // body && decorations
    for(const action in config[key]) {
      const aVO = config[key][action]

      if(!body[aVO.body]) {
        body[aVO.body] = {}
        body[aVO.body].str = ''
        body[aVO.body].action = action
      }

      body[aVO.body].str += `_${weaponNum}`

      if(aVO.deco) {
        if(!decorations[aVO.deco]) {
          decorations[aVO.deco] = {}
          decorations[aVO.deco].str = ''
          decorations[aVO.deco].action = action
        }

        decorations[aVO.deco].str += `_${weaponNum}`
      }
    }
  }

  for(const key in body) {
    // const names = key.split('_')
    // let k = reg.exec(names[1])[1]
    // k = (k === 'magic') ? 'skill_magic' : k
    const v = body[key].str === '_1_2_3_4_5_6' ? '' : body[key].str
    newVO.body[body[key].action + v] = key
  }

  for(const key in decorations) {
    // const names = key.split('_')
    // let k = reg.exec(names[1])[1]
    // k = (k === 'magic') ? 'skill_magic' : k
    // const v = decorations[key] === '_1_2_3_4_5_6' ? '' : decorations[key]
    // newVO.avatar.decoration[k + v] = key
    const v = decorations[key].str === '_1_2_3_4_5_6' ? '' : decorations[key].str
    newVO.avatar.decoration[decorations[key].action + v] = key
  }

  cb(null, newVO)
}

// create subfolders by new structs
function createFolders(file, vo, cb) {
  console.log(vo)
  // create body, weapon, decorations
  for(const key in vo) {
    if(key === 'weapon') continue
    const dir = `${PATH_OUTPUT}/role_${file}/@${key}`
    try{
      fs.accessSync(dir)
    }catch(err) {
      fs.mkdirSync(dir)
    }
  }

  // create weapon
  const dirW = `${PATH_OUTPUT}/role_${file}/weapon`
  try{
    fs.accessSync(dirW)
  }catch(err) {
    fs.mkdirSync(dirW)
  }

  for(const key in vo.weapon) {
    const dirK = `${PATH_OUTPUT}/role_${file}/weapon/@${key}`
    try{
      fs.accessSync(dirK)
    }catch(err) {
      fs.mkdirSync(dirK)
    }
  }

  // create decorations
  const dirD = `${PATH_OUTPUT}/role_${file}/@avatar/_decoration`
  try{
    fs.accessSync(dirD)
  }catch(err) {
    fs.mkdirSync(dirD)
  }

  cb(null, vo)
}
