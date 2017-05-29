const { resolve } = require('path')

/**
 * Contains the configuration of the project extracted from the CLI.
 */
class Config {
  /**
   * @constructor
   * @param {string} path - Path to the root of the project, '.' by default.
   */
  constructor (path = '.') {
    this._path = resolve(path)
    this._ignoreDirs = [resolve(this._path, './node_modules')]
    this._withES7 = false
    this._withJSX = false
  }

  /** @return {string} Path to the root of the project. */
  get path () {
    return this._path
  }

  /** @return {array} Array of paths of directories to ignore. */
  get ignoreDirs () {
    return this._ignoreDirs
  }

  /** @return {boolean} If the project uses ES7 features or not. */
  get withES7 () {
    return this._withES7
  }

  /** @return {boolean} If the project supports `JSX` syntax or not. */
  get withJSX () {
    return this._withJSX
  }

  /** @param {string} val - Path to the project root. */
  set path (val) {
    this._path = val
  }

  /** @param {string} val - Path to add the ignore list. */
  set ignoreDirs (val) {
    const file = resolve(this._path, val)
    if (!this._ignoreDirs.includes(file)) {
      this._ignoreDirs.push(file)
    }
  }

  /** @param {boolean} val - If the project uses ES7 features or not. */
  set withES7 (val) {
    this._withES7 = Boolean(val)
  }

  /** @return {boolean} If the project supports `JSX` syntax or not. */
  set withJSX (val) {
    this._withJSX = Boolean(val)
  }
}

module.exports = Config
