'use strict'
const async = require('async')

const trim = require('./trim')
const bin = require('./bin')
const output = require('./output')
const meta = require('./meta')

/**
 * walk through all png in the input folder, and pack them into one png
 * with an extra 'alpha channel' for masking and color changing.
 * @input {string} input files dir
 * @option {object} options.output | options.name | options.hasAlpha
 * @callback {function} callback function
*/
module.exports = function texturepack(input, options, callback) {
  async.waterfall([
    function (cb) {
      trim(input, options.hasAlpha, cb)
    },
    function (files, cb) {
      bin(files, cb)
    },
    function (files, width, height, cb) {
      options.width = width
      options.height = height

      output(input, options, files, cb)
    },
    function (files, cb) {
      meta(files, options, cb)
    }
  ], callback)
}
