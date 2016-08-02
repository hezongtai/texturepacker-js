'use strict'
const fs = require('fs')
const path = require('path')

const exec = require('platform-command').exec

module.exports = (input, options, files, callback) => {
  options.width = roundToPowerOfTwo(options.width)
  options.height = roundToPowerOfTwo(options.height)
  // input images
  const command = [`convert -define png:exclude-chunks=date -size ${options.width}x${options.height} xc:none`]

  // combine all images by packer's info
  files.forEach(file => {
    command.push(`"${file.path}" -geometry +${file.x}+${file.y} -composite`)
  })

  command.push(`${options.output}/${options.name}.png`)

  // input channel images
  if(options.hasAlpha) {
    command.push(`&& convert -define png:exclude-chunks=date -size ${canvasW}x${canvasH} xc:black -alpha off`)

    files.forEach(file => {
      const offsetX = (file.fit.x - file.crop.x) >= 0 ? `+${file.fit.x - file.crop.x}` : `-${Math.abs(file.fit.x - file.crop.x)}`
      const offsetY = file.fit.y - file.crop.y >= 0 ? `+${file.fit.y - file.crop.y}` : `-${Math.abs(file.fit.y - file.crop.y)}`

      command.push(`"${file.iPathA}" -geometry ${offsetX}${offsetY} -composite`)
    })

    command.push(`${options.output}/a/${options.name}_a.png`)

    // remove alpha channel from origin
    command.push(`&& convert ${options.output}/${options.name}.png -background black -alpha remove ${options.output}/${options.name}.png`)
  }else {
    // extract alpha channel from origin
    command.push(`&& convert ${options.output}/${options.name}.png -alpha extract ${options.output}/a/${options.name}_a.png`)
    // replace it to green
    command.push(`&& convert ${options.output}/a/${options.name}_a.png -background lime -alpha shape ${options.output}/a/${options.name}_a.png`)
    // delete alpha channel
    command.push(`&& convert ${options.output}/a/${options.name}_a.png -background black -alpha remove ${options.output}/a/${options.name}_a.png`)
  }
  
  files.forEach(file => {
    // create trim frame
    file.trimX = file.trim.x
    file.trimY = file.trim.y
    file.trimW = file.trim.width
    file.trimH = file.trim.height

    file.name = path.basename(file.path).match(/_(\d+\.png)$/)[1]

    delete file.trim
  })

  exec(command.join(' '), err => {
    if(err) throw err
    callback(null, files)
  })
}

function roundToPowerOfTwo(value) {
  let powers = 2
  while (value > powers) {
    powers *= 2
  }

  return powers
}
