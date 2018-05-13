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
    this.p = resolve(path)
    this.ignore = [resolve(this.path, './node_modules')]
    this.es7 = false
    this.jsx = false
  }

  /** @return {string} Path to the root of the project. */
  get path () {
    return this.p
  }

  /** @return {array} Array of paths of directories to ignore. */
  get ignoreDirs () {
    return this.ignore
  }

  /** @return {boolean} If the project uses ES7 features or not. */
  get withES7 () {
    return this.es7
  }

  /** @return {boolean} If the project supports `JSX` syntax or not. */
  get withJSX () {
    return this.jsx
  }

  /** @param {string} val - Path to the project root. */
  set path (val) {
    this.p = val
  }

  /** @param {string} val - Path to add the ignore list. */
  set ignoreDirs (val) {
    const add = f => {
      const file = resolve(this.path, f)
      if (!this.ignore.includes(file)) {
        this.ignore.push(file)
      }
    }

    if (Array.isArray(val)) {
      val.forEach(v => add(v))
    } else {
      add(val)
    }
  }

  /** @param {boolean} val - If the project uses ES7 features or not. */
  set withES7 (val) {
    this.es7 = Boolean(val)
  }

  /** @return {boolean} If the project supports `JSX` syntax or not. */
  set withJSX (val) {
    this.jsx = Boolean(val)
  }
}

module.exports = Config
