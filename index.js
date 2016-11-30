'use strict'

const fs = require('fs')
const async = require('async')
const inquirer = require('inquirer')

const configRole = require('./src/role/config')
const generateRole = require('./src/role/generate')

const generateNPC = require('./src/npc/generate')

const generatePet = require('./src/pet/generate')

const PATH = 'svn/sprites'
const PATH_OUTPUT = 'svn/sprites_output'

console.log(`Packing images from ${PATH} to ${PATH_OUTPUT}`)

const questions = [
  {
    type: 'list',
    name: 'action',
    message: 'Select the packing action:',
    choices: [
      {name: 'role'},
      {name: 'npc'},
      {name: 'companion'},
      {name: 'pet'},
      {name: 'all'}]
  }
]
inquirer.prompt(questions).then(answers => {
  switch(answers.action) {
    case 'role':
      selectRole()
      break
    case 'npc':
      selectNPC('npc')
      break
    case 'companion':
      selectNPC('companion')
      break
    case 'pet':
      selectPet('pet')
      break
    case 'all':
      break
    default:
      break
  }
})

function selectRole() {
  fs.readdir(PATH, (err, files) => {
    if(err) throw err
    const question = {
      type: 'list',
      name: 'roleName',
      message: 'select a role:',
      choices: []
    }
    files.forEach(file => {
      if(fs.statSync(`${PATH}/${file}`).isDirectory() && file !== '.svn' && file !== 'npc' && file !== 'companion' && file !== 'pet') {
        question.choices.push(file)
      }
    })

    question.choices.push('-- all --')
    question.choices.push(new inquirer.Separator())

    inquirer.prompt(question).then(answers => {
      if(answers.roleName === '-- all --') {
        if(err) throw err
        async.eachSeries(files, (file, next) => {
          if(fs.statSync(`${PATH}/${file}`).isDirectory() && file !== '.svn' && file !== 'npc' && file !== 'companion' && file !== 'pet') {
            packRole(file, next)
          }else{
            next()
          }
        })
      }else{
        packRole(answers.roleName)
      }
    })
  })
}

function packRole(name, callback) {
  console.log(`++++++`)
  configRole(name, PATH, PATH_OUTPUT, (caller, vo) => {
    generateRole(name, vo, () => {
      if(callback) callback()
    })
  })
}

function selectNPC(path) {
  fs.readdir(`${PATH}/${path}`, (err, files) => {
    if(err) throw err
    const question = {
      type: 'list',
      name: 'npcName',
      message: 'select a npc:',
      choices: []
    }
    files.forEach(file => {
      if(fs.statSync(`${PATH}/${path}/${file}`).isDirectory()) {
        question.choices.push(file)
      }
    })

    question.choices.push('-- all --')
    question.choices.push(new inquirer.Separator())

    inquirer.prompt(question).then(answers => {
      if(answers.npcName === '-- all --') {
        async.eachSeries(files, (file, next) => {
          packNPC(path, file, next)
        })
      } else {
        packNPC(path, answers.npcName, () => {
        })
      }
    })
  })
}

function packNPC(path, name, next) {
  generateNPC(PATH, PATH_OUTPUT, {npc: path, action: name}, () => {
    if(next) next()
  })
}

function selectPet(path) {
  fs.readdir(`${PATH}/${path}`, (err, files) => {
    if(err) throw err
    const question = {
      type: 'list',
      name: 'petName',
      message: 'select a pet:',
      choices: []
    }
    files.forEach(file => {
      if(fs.statSync(`${PATH}/${path}/${file}`).isDirectory()) {
        question.choices.push(file)
      }
    })

    question.choices.push('-- all --')
    question.choices.push(new inquirer.Separator())

    inquirer.prompt(question).then(answers => {
      if(answers.petName === '-- all --') {
        async.eachSeries(files, (file, next) => {
          packPet(path, file, next)
        })
      } else {
        packPet(path, answers.petName, () => {
        })
      }
    })
  })
}

function packPet(path, name, next) {
  generatePet(PATH, PATH_OUTPUT, {pet: path, action: name}, () => {
    if(next) next()
  })
}
