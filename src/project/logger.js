const AbstractIssue = require('./abstract-issue')

/**
 * Stores all the reported issues found in the project. It support different
 * types:
 *
 * - **Dependency issues:** Unused or missing dependencies.
 * - **Module issues:** Unused modules.
 * - **Code issues:** Fragments of dead code.
 */
class Logger {
  /** @constructor */
  constructor () {
    this._dependencies = []
    this._modules = []
    this._code = []
  }

  /**
   * Adds a new issue to the logger.
   *
   * @param {Issue} issue - Issue to be reported.
   */
  report (issue) {
    switch (issue.type) {
      case AbstractIssue.DEPENDENCY : this._dependencies.push(issue); break
      case AbstractIssue.MODULE: this._modules.push(issue); break
      case AbstractIssue.CODE : this._code.push(issue); break
    }
  }

  /**
   * Retrieves the reported dependency issues.
   * @return {array} - Dependency issues.
   */
  get dependencies () {
    return this._dependencies
  }

  /**
   * Retrieves the reported module issues.
   * @return {array} - Module issues.
   */
  get modules () {
    return this._modules
  }

  /**
   * Retrieves the reported code issues.
   * @return {array} - Code issues.
   */
  get code () {
    return this._code
  }
}

module.exports = Logger
