'use strict'

const BinPacker = require('./maxrectsbin')

module.exports = (files, callback) => {
  const packer = new BinPacker(2048, 2048, false)

  // max side sort
  files.sort((a, b) => {
    return msort(a, b, ['max', 'min', 'h', 'w'])
  })

  const res = packer.insert2(files, 1)
  callback(null, res, packer.maxW, packer.maxH)
}

const Sorters = {
  w: (a, b) => {
    return b.width - a.width
  },
  h: (a, b) => {
    return b.height - a.height
  },
  a: (a, b) => {
    return b.area - a.area
  },
  max: (a, b) => {
    return Math.max(b.width, b.height) - Math.max(a.width, a.height)
  },
  min: (a, b) => {
    return Math.min(b.width, b.height) - Math.min(a.width, a.height)
  }
}

function msort(a, b, criteria) {
  /* sort by multiple criteria */
  let diff = 0

  for (let n = 0; n < criteria.length; n++) {
    diff = Sorters[criteria[n]](a, b)
    if (diff !== 0) {
      return diff
    }
  }

  return 0
}
