const { resolve } = require('path')

class Config {
  constructor (path = '.') {
    this._path = resolve(path)
    this._ignoreDirs = [resolve(this._path, './node_modules')]
    this._withES7 = false
    this._withJSX = false
  }

  get path () {
    return this._path
  }

  get ignoreDirs () {
    return this._ignoreDirs
  }

  get withES7 () {
    return this._withES7
  }

  get withJSX () {
    return this._withJSX
  }

  set ignoreDirs (val) {
    const file = resolve(this._path, val)
    if (!this._ignoreDirs.includes(file)) {
      this._ignoreDirs.push(file)
    }
  }

  set withES7 (val) {
    this._withES7 = Boolean(val)
  }

  set withJSX (val) {
    this._withJSX = Boolean(val)
  }
}

module.exports = Config
