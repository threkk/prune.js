const process = require('process')

function filterByStart(prefix) {
  const obj = {}
  for (const key in process.env) {
    if (key.startsWith(prefix)) {
      obj[key] = process.env[key]
    }
  }
  return obj
}

module.exports = filterByStart
