const chalk = require('chalk')
const { CODE, DEPENDENCY, ERROR, MODULE } = require('./report/type')

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
    this.dependencies = []
    this.errors = []
    this.modules = []
    this.code = []
  }

  /**
   * Adds a new issue to the logger.
   *
   * @param {Issue} issue - Issue to be reported.
   */
  report (issue) {
    switch (issue.type) {
      case CODE : this.code.push(issue); break
      case DEPENDENCY : this.dependencies.push(issue); break
      case MODULE : this.modules.push(issue); break
      default : this.errors.push(issue); break
    }
  }

  /**
   * Inidicates if the logger contains any error.
   *
   * @param {Symbol} type - Type of error to check, or null for anyone.
   */
  hasErrors (type = null) {
    switch (type) {
      case CODE: return this.code.length > 0
      case DEPENDENCY: return this.dependencies.length > 0
      case ERROR: return this.errors.length > 0
      case MODULE: return this.modules.length > 0
      default: return this.code.length > 0 ||
        this.dependencies.length > 0 ||
        this.errors.length > 0 ||
        this.modules.length > 0
    }
  }

  /** Displays a message showing the issues with the dependencies. */
  displayDependencies () {
    const amount = this.dependencies.length
    console.log(chalk.bold('Dependencies'))
    console.log((`${amount} dependency issue${amount === 1 ? ' was' : 's were'} found.`))

    this.dependencies.forEach(dep => console.log(`  - ${dep}`))
    console.log('')
  }

  /** Displays a message showing the issues with the modules.  */
  displayModules () {
    const amount = this.modules.length

    console.log(chalk.bold('Modules'))
    console.log((`${amount} module issues were found.`))

    this.modules.forEach(mod => console.log(`  - ${mod}`))
    console.log('')
  }

  /** Displays a message showing the issues with the fragments of code. */
  displayCode () {
    const amount = this.code.length

    console.log(chalk.bold('Code'))
    console.log((`${amount} code issue${amount === 1 ? ' was' : 's were'} found.`))

    this.code.forEach(frag => console.log(`  - ${frag}`))
    console.log('')
  }

  /** Displays a message in the stderr showing errors during the analysis. */
  displayErrors () {
    const amount = this.errors.length

    console.error(chalk.red(chalk.bold('Errors')))
    console.error(chalk.red(`${amount} error${amount === 1 ? ' was' : 's were'} found analysing the project.`))

    this.errors.forEach(err => console.error(chalk.red(`  - ${err}`)))
    console.error('')
  }
}

module.exports = Logger
