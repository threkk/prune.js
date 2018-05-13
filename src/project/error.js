const chalk = require('chalk')
const AbstractIssue = require('../abstract/issue')

/**
 * Reports an error in the program, not related with the code itself but with
 * the analysis.
 */
class ErrorIssue extends AbstractIssue {
  /**
   * @constructor
   * @param {string} path - Path to the place where the error happened.
   * @param {string} error - Problem found.
   */
  constructor (path, error) {
    super(AbstractIssue.ERROR)
    this.error = error
    this.path = path
  }

  toString () {
    return chalk.red(`Error found at ${this.path}: ${this.error}`)
  }

  static toSymbol () {
    return AbstractIssue.ERROR
  }
}

module.exports = ErrorIssue
