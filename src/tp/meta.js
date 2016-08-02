'use strict'

const fs = require('fs')

module.exports = (files, options, callback) => {
  const frames = {}

  files.forEach(file => {
    frames[file.name] = {}
    frames[file.name].rotated = false
    frames[file.name].trimmed = true
    frames[file.name].frame = {x: file.x, y: file.y, w: file.width, h: file.height}
    frames[file.name].spriteSourceSize = {x: file.trimX, y: file.trimY, w: file.width, h: file.height}
    frames[file.name].sourceSize = {w: file.trimW, h: file.trimH}
  })

  const meta = {
    image: `${options.name}.png`,
    format: 'RGB888',
    size: {w: options.width, h: options.height},
    scale: 1
  }

  const json = {frames, meta}
  fs.writeFile(`${options.output}/${options.name}.json`, JSON.stringify(json, null, 2), err => {
    if(err) throw err
    callback()
  })
}
