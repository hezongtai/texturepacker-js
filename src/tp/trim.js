'use strict'

const fs = require('fs')
const path = require('path')

const async = require('async')
const exec = require('platform-command').exec

/**
 * Generate temporary trimmed image files
 * @param {string[]} input file path
 * @param {object} options
 * @param {boolean} options.trim is trimming enabled
 * @param callback
 */
module.exports = (inputPath, hasAlpha, callback) => {
  async.waterfall([
    cb => {
      readDir(inputPath, hasAlpha, [], cb)
    },
    (files, cb) => {
      trimImages(inputPath, hasAlpha, files, cb)
    },
    (files, cb) => {
      getTrimInfo(inputPath, hasAlpha, files, cb)
    }
  ], callback)
}

// read all png files from input path
function readDir(input, hasAlpha, files, callback) {
  fs.readdir(input, (err, images) => {
    if(err) throw err
    images.forEach(image => {
      if(path.extname(image).toLowerCase() === '.png') files.push({
        name: path.basename(image, '.png'),
        iPath: `${input}/${image}`,
        iPathA: hasAlpha ? `${input}_a/${image}` : `${input}/${image}`// alpha channel
      })
    })
    callback(null, files)
  })
}

function trimImages(input, hasAlpha, files, callback) {
  async.eachSeries(files, (file, next) => {
	// have to add 1px transparent border because imagemagick does trimming based on border pixel's color
    // only to list the result on what part of the image was trimmed, not the actual trimmed image
    // use alpha channel's crop area

    const command = [`convert -define png:exclude-chunks=date ${file.iPath} -bordercolor transparent -border 1 -trim ${file.iPath}`]

    if(hasAlpha) {
      command.push(`&& convert -define png:exclude-chunks=date ${file.iPathA} -bordercolor transparent -border 1 -trim ${file.iPathA}`)
    }

    exec(command.join(' '), err => {
      if(err) throw err
      next()
    })
  }, () => {
    callback(null, files)
  })
}

function getTrimInfo(input, hasAlpha, files, callback) {
  const filePaths = files.map(file => {
    return '"' + file.iPathA + '"'
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

      const rect = item.match(/ ([0-9]+)x([0-9]+)[\+\-]([0-9]+)[\+\-]([0-9]+) /)
      file.trim = {}
      file.trim.x = parseInt(rect[3], 10) - 1
      file.trim.y = parseInt(rect[4], 10) - 1
      file.trim.width = parseInt(rect[1], 10) - 2
      file.trim.height = parseInt(rect[2], 10) - 2

      if(hasAlpha) {
        file.pathA = item.match(/.+\.png/)[0]
        const spath = file.pathA
        file.path = spath.replace(/_a\//i, '/')
      } else {
        file.path = item.match(/.+\.png/)[0]
      }
      trimmedFiles.push(file)
    })
    callback(null, trimmedFiles)
  })
}

/*
function resizeImages(files, callback){
  async.eachSeries(files, (file, next) => {
    exec(`convert -resize ${RESIZE} ${file.iPath} ${file.tPath}`, (err) => {
      if(err) throw err
      next()
    })
  }, () => {
    callback(null, files)
  })
}

function getCropInfo(files, callback) {
    async.eachSeries(files, (file, next) => {
    // file.tPath = path.join(os.tmpDir(), `${file.name}_trimmed.png`) // temp path for trimed file

		// have to add 1px transparent border because imagemagick does trimming based on border pixel's color
    // only to list the result on what part of the image was trimmed, not the actual trimmed image
    // use alpha channel's crop area
    exec(`convert -define png:exclude-chunks=date ${file.tPath} -bordercolor transparent -border 1 -trim info:-`, (err, stdout) => {
      if(err) throw err
      const size = stdout.match(sizeReg)

      file.x = file.y = 0
      file.w = Number(size[1])
      file.h = Number(size[2])

      const rect = stdout.match(rectReg)
      file.crop = {
        x: parseInt(rect[3], 10) - 1,
        y: parseInt(rect[4], 10) - 1,
        w: parseInt(rect[1], 10) - 2,
        h: parseInt(rect[2], 10) - 2
      }

      next()
    })
  }, () => {
    callback(null, files)
  })
}
*/
