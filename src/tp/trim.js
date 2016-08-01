'use strict'

const fs = require('fs')
const os = require('os')
const path = require('path')

const async = require('async')
const exec = require('platform-command').exec

const RESIZE = '75%'

/**
 * Generate temporary trimmed image files
 * @param {string[]} input file path
 * @param {object} options
 * @param {boolean} options.trim is trimming enabled
 * @param callback
 */
module.exports = (inputPath, callback) => {
  async.waterfall([
    cb => {
      readDir(inputPath, [], cb)
    },
    (files, cb) => {
      trimImages(inputPath, files, cb)
    },
    (files, cb) => {
      getTrimInfo(inputPath, files, cb)
    }
  ], callback)
}

// read all png files from input path
function readDir(input, files, callback) {
  try {
    fs.statSync(`${input}/trimmed`)
  }catch(err) {
    fs.mkdirSync(`${input}/trimmed`)
  }

  fs.readdir(input, (err, images) => {
    if(err) throw err
    images.forEach(image => {
      if(path.extname(image).toLowerCase() === '.png') files.push({
        name: path.basename(image, '.png'),
        iPath: `${input}/${image}`,
        tPath: `${os.tmpdir()}/tp_${(new Date()).getTime()}_${image}`
      })
    })
    callback(null, files)
  })
}

function trimImages(input, files, callback) {
  async.eachSeries(files, (file, next) => {
	// have to add 1px transparent border because imagemagick does trimming based on border pixel's color
    // only to list the result on what part of the image was trimmed, not the actual trimmed image
    // use alpha channel's crop area

    exec(`convert -define png:exclude-chunks=date -resize ${RESIZE} ${file.iPath} -bordercolor transparent -border 1 -trim ${file.tPath}`, err => {
      if(err) throw err
      next()
    })
  }, () => {
    callback(null, files)
  })
}

function getTrimInfo(input, files, callback) {
  const filePaths = files.map(file => {
    return '"' + file.tPath + '"'
  })

  const trimmedFiles = []

  exec('identify ' + filePaths.join(' '), (err, stdout) => {
    if (err) return callback(err)

    let sizes = stdout.split('\n')
    sizes = sizes.splice(0, sizes.length - 1)
    sizes.forEach(item => {
      const file = {}
      const size = item.match(/ ([0-9]+)x([0-9]+) /)

      file.x = file.y = 0
      file.width = parseInt(size[1], 10)
      file.height = parseInt(size[2], 10)

      file.area = file.width * file.height
      // console.log(file.area)

      const rect = item.match(/ ([0-9]+)x([0-9]+)[\+\-]([0-9]+)[\+\-]([0-9]+) /)
      file.trim = {}
      file.trim.x = parseInt(rect[3], 10) - 1
      file.trim.y = parseInt(rect[4], 10) - 1
      file.trim.width = parseInt(rect[1], 10) - 2
      file.trim.height = parseInt(rect[2], 10) - 2

      file.path = item.match(/.+\.png/)[0]

      trimmedFiles.push(file)
    })

    callback(null, trimmedFiles)
  })
}
