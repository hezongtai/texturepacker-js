'use strict'

const binpacking = require('binpacking')

module.exports = (files, callback) => {
  const packer = new binpacking.GrowingPacker()
  // max side sort
  files.sort((a, b) => {
    return msort(a, b, ['max', 'min', 'h', 'w'])
  })

  packer.fit(files)

  callback(null, files, packer.root.w, packer.root.h)
}

const Sorters = {
  w: (a, b) => {
    return b.w - a.w
  },
  h: (a, b) => {
    return b.h - a.h
  },
  a: (a, b) => {
    return b.area - a.area
  },
  max: (a, b) => {
    return Math.max(b.w, b.h) - Math.max(a.w, a.h)
  },
  min: (a, b) => {
    return Math.min(b.w, b.h) - Math.min(a.w, a.h)
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
