const chalk = require('chalk')
const _ = require('underscore')
const AbstractIssue = require('../abstract/issue')

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
    this._errors = []
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
      case AbstractIssue.ERROR : this._errors.push(issue); break
      case AbstractIssue.MODULE : this._modules.push(issue); break
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
   * Retrieves the errors found during the analysis.
   * @return {array} - Errors.
   */
  get errors () {
    return this._errors
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

  /** Displays a message showing the issues with the dependencies. */
  displayDependencies () {
    const amount = this._dependencies.length

    console.log(chalk.bold('Dependencies'))
    if (amount === 1) {
      console.log(`1 dependency issue was found.`)
    } else {
      console.log((`${amount} dependency issues were found.`))
    }

    _.map(this._dependencies, (dep) => console.log(`- ${dep}`))
  }

  /** Displays a message showing the issues with the modules.  */
  displayModules () {
    const amount = this._modules.length

    console.log(chalk.bold('Modules'))
    if (amount === 1) {
      console.log(`1 module issue was found.`)
    } else {
      console.log((`${amount} module issues were found.`))
    }

    _.map(this._modules, (mod) => console.log(`- ${mod}`))
  }

  /** Displays a message showing the issues with the fragments of code. */
  displayCode () {
    const amount = this._code.length

    console.log(chalk.bold('Code'))
    if (amount === 1) {
      console.log(`1 code issue was found.`)
    } else {
      console.log((`${amount} code issues were found.`))
    }

    _.map(this._code, (frag) => console.log(`- ${frag}`))
  }

  /** Displays a message in the stderr showing errors during the analysis. */
  displayErrors () {
    const amount = this._errors.length

    console.error(chalk.bold('Errors'))
    if (amount === 1) {
      console.error(`1 error was found analysing the project.`)
    } else {
      console.error(`${amount} erros were found analysing the project.`)
    }

    _.map(this._errors, (err) => console.error(chalk.red(`- ${err}`)))
  }
}

module.exports = Logger
