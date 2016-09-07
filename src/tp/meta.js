'use strict'

const fs = require('fs')
const plist = require('plist')

module.exports = (files, options, callback) => {
  const frames = {}

  files.forEach(file => {
    frames[file.name] = {}
    // frames[file.name].rotated = false
    // frames[file.name].trimmed = true
    // frames[file.name].frame = {x: file.x, y: file.y, w: file.width, h: file.height}
    // frames[file.name].spriteSourceSize = {x: file.trimX, y: file.trimY, w: file.width, h: file.height}
    // frames[file.name].sourceSize = {w: file.trimW, h: file.trimH}
    //
    const offsetX = (file.width * 0.5) - ((file.trimW * 0.5) - file.trimX)
    const offsetY = (file.height * 0.5) - ((file.trimH * 0.5) - file.trimY)

    frames[file.name].aliases = []
    frames[file.name].spriteOffset = `{${offsetX},${offsetY}}`
    frames[file.name].spriteSize = `{${file.width},${file.height}}`
    frames[file.name].spriteSourceSize = `{${file.trimW},${file.trimH}}`
    frames[file.name].textureRect = `{{${file.x},${file.y}},{${file.width},${file.height}}}`
    frames[file.name].textureRotated = false
  })

  const metadata = {
    premultiplyAlpha: false,
    format: 3,
    pixelFormat: 'RGB888',
    textureFileName: `${options.name}.pvr`,
    realTextureFileName: `${options.name}.pvr`,
    size: `{${options.width},${options.height}}`
  }

  const json = {frames, metadata}
  fs.writeFile(`${options.output}/${options.name}.plist`, plist.build(json), err => {
    if(err) throw err
    callback()
  })
}
