const chalk = require('chalk')
const { ERROR } = require('./type')

/**
 * Reports an error in the program, not related with the code itself but with
 * the analysis.
 */
class ErrorReport {
  /**
   * @constructor
   * @param {string} path - Path to the place where the error happened.
   * @param {string} error - Problem found.
   */
  constructor (path, error) {
    this.error = error
    this.path = path
    this.type = ErrorReport.symbol()
  }

  toString () {
    return chalk.red(`Error found at ${this.path}: ${this.error}`)
  }

  static symbol () {
    return ERROR
  }
}

module.exports = ErrorReport
