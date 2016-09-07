'use strict'

const fs = require('fs')
const path = require('path')

const async = require('async')

const exec = require('platform-command').exec
const md5 = require('../md5sum')

// /Applications/Imagination/PowerVR_Graphics/PowerVR_Tools/PVRTexTool/CLI/OSX_x86/PVRTexToolCLI
module.exports = (input, options, callback) => {
  md5.validate(input, 'md5.chk', error => {
    if(error) {
      try{
        fs.unlinkSync(`${input}/md5.chk`)
      }catch(err) {
        // console.log(err)
      }

      if(options.genAlpha === false) {
        repack()
      }else{
        regen()
      }
    }else{
      callback()
    }
  })

  function repack() {
    const name = (/(.+)(_a)$/).exec(options.name)[1]
    const cmd = `TexturePacker --data ${options.output}/${name}.plist --replace \.png=-${options.character}-${name} --max-size 1024 --format cocos2d --texture-format pvr3ccz --disable-rotation --opt PVRTC4_NOALPHA --force-squared ${input}`

    exec(cmd, err => {
      if(err) throw err

      /* md5.calculate(input, 'md5.chk', error => {
        if(error) throw error
        callback()
      })*/
      callback()
    })
  }

  function regen() {
    fs.readdir(input, (err, images) => {
      if(err) throw err

      async.eachSeries(images, (image, next) => {
        if(path.extname(image).toLowerCase() === '.png') {
          const iPath = `${input}/${image}`

          try{
            fs.statSync(`${options.output}`)
          }catch(err) {
            fs.mkdirSync(`${options.output}`)
          }

          const command = []
          command.push(`convert ${iPath} -alpha extract ${options.output}/${image}`)
          // replace it to green
          command.push(`&& convert ${options.output}/${image} -background lime -alpha shape ${options.output}/${image}`)

          exec(command.join(' '), err => {
            if(err) throw err
            next()
          })
        }else{
          next()
        }
      }, callback)
    })
  }
}
