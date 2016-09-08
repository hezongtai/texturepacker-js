'use strict'
const fs = require('fs')
const path = require('path')
// const os = require('os')

const exec = require('platform-command').exec

// const PVRTexTool = '/Applications/Imagination/PowerVR_Graphics/PowerVR_Tools/PVRTexTool/CLI/OSX_x86/PVRTexToolCLI'

module.exports = (input, options, files, callback) => {
  // POT
  options.width = roundToPowerOfTwo(options.width)
  options.height = roundToPowerOfTwo(options.height)

  // square canvas
  if(options.width > options.height) options.height = options.width
  if(options.height > options.width) options.width = options.height
  // input images
  const command = [`convert -define png:exclude-chunks=date -size ${options.width}x${options.height} xc:none`]

  // combine all images by packer's info
  files.forEach(file => {
    command.push(`"${file.path}" -geometry +${file.x}+${file.y} -composite`)
  })

  command.push(`${options.output}/${options.name}.png`)

  const reg = /(.+)(_a)$/
  // if the alpha channel's folder not existed, then create an alpha map automatically
  if(reg.exec(options.name) === null) {
    try{
      fs.statSync(`${input}_a`)
    }catch(err) {
      // extract alpha channel from origin
      command.push(`&& convert ${options.output}/${options.name}.png -alpha extract ${options.output}/${options.name}_a.png`)
      // replace it to green
      command.push(`&& convert ${options.output}/${options.name}_a.png -background lime -alpha shape ${options.output}/${options.name}_a.png`)
      // delete alpha channel
      command.push(`&& convert ${options.output}/${options.name}_a.png -background black -alpha remove ${options.output}/${options.name}_a.png`)
      // convert to pvr
      // command.push(`&& ${PVRTexTool} -i ${options.output}/${options.name}_a.png -f PVRTC1_4,UBN,lRGB -o ${options.output}/${options.name}_a.pvr`)
    }
  }
  // remove alpha channel from origin
  command.push(`&& convert ${options.output}/${options.name}.png -background black -alpha remove ${options.output}/${options.name}.png`)

  // convert to pvr
  // command.push(`&& ${PVRTexTool} -i ${options.output}/${options.name}.png -f PVRTC1_4,UBN,lRGB -o ${options.output}/${options.name}.pvr`)

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
