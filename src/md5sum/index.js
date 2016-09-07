const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const PATTERN_BACK_SLASH = /\\/g

/**
 * Calculate 128-bit MD5 checksum of the given ReadStream.
 * @param rs {Object}
 * @param callback {Function}
 */
function md5sum(rs, callback) {
  const hash = crypto.createHash('md5')

  rs.on('data', data => {
    hash.update(data)
  })

  rs.on('end', () => {
    callback(hash.digest('hex'))
  })
}

/**
 * Get a file list of the given directory.
 * @param base {string}
 * @param callback {Function}
 * @param _current {string}
 * @param _result {Array}
 */
function travel(base, callback, _current, _result) {
  _current = _current || ''
  _result = _result || []

  fs.readdir(path.join(base, _current), (err, filenames) => {
    if (err) {
      return callback(err)
    }

    const len = filenames.length
    let i = 0
    function next(err) {
      if (err) {
        return callback(err)
      }

      if (i < len) {
        const pathname = path.join(_current, filenames[i++])

        fs.stat(path.join(base, pathname), (err, stats) => {
          if (err) {
            return callback(err)
          }

          if (stats.isFile()) {
            _result.push(pathname)
            next()
          } else if (stats.isDirectory()) {
            travel(base, next, pathname, _result)
          }
        })
      } else {
        callback(null, _result)
      }
    }
    next()
  })
}

/**
 * Calculate MD5 checksums for a directory.
 * @param dir {string}
 * @param filename {string}
 * @param callback {Function}
 */
exports.calculate = function (dir, filename, callback) {
  travel(dir, (err, pathnames) => {
    if (err) {
      return callback(err)
    }

    const result = []

    function next(i) {
      if (i < pathnames.length) {
        const rs = fs.createReadStream(
            path.join(dir, pathnames[i]))

        md5sum(rs, md5 => {
          const pathname = pathnames[i]
              .replace(PATTERN_BACK_SLASH, '/')

          result.push(md5 + ' ' + pathname)
          next(i + 1)
        })
      } else {
        fs.writeFile(path.join(dir, filename),
          result.join('\n'), callback)
      }
    }
    next(0)
  })
}

/**
 * Validate files with the given checksums.
 * @param dir {string}
 * @param filename {string}
 * @param callback {Function}
 */
exports.validate = function (dir, filename, callback) {
  fs.readFile(path.join(dir, filename), 'utf8', (err, checksum) => {
    if (err) {
      return callback(err)
    }

    checksum = checksum.split('\n').map(line => {
      line = line.trim().split(' ')

      return {
        md5: line.shift(),
        pathname: line.join(' ')
      }
    })

    const files = fs.readdirSync(dir)
    const filesNum = files.indexOf('md5.chk') > 0 ? files.length - 1 : files.length
    if(filesNum !== checksum.length) {
      return callback(new Error('files in the ${dir} has changed'))
    }

    function next(i) {
      if (i < checksum.length) {
        const rs = fs.createReadStream(
            path.join(dir, checksum[i].pathname))

        md5sum(rs, md5 => {
          if (md5 === checksum[i].md5) {
            next(i + 1)
          } else {
            callback(new Error('"' +
               checksum[i].pathname + '" failed'))
          }
        })
      } else {
        callback(null)
      }
    }
    next(0)
  })
}
