const fs = require('fs')
const chalk = require('chalk')
const ora = require('ora')
const path = require('path')
const validator = require('package-json-validator').PJV
const _ = require('underscore')

/**
 * The Project class acts as a monad and holds all the different analysers to
 * apply to the project.
 */
class Project {
  /**
   * Creates a Project instance
   *
   * @constructor
   * @param {Object} config - Configuration of the project from the CLI.
   * @param {Logger} logger - Logger where the analysers report their findings.
   */
  constructor (config, logger) {
    this._analysers = []
    this._config = config
    this._logger = logger
  }

  /**
   * Attaches the analyser to the project. It will report its findings to the
   * logger.
   *
   * @param {Analyser} analyser - Analyser to attach.
   * @return {Project} - The objects itself to allow method chaining.
   */
  analyse (Analyser) {
    this._analysers.push(new Analyser(this._config))
    return this
  }

  /**
   * Executes all the registered analysers and display the results in the
   * screen.
   */
  execute () {
    const spinner = ora('Processing...').start()
    Promise.all(
      _.map(this._analysers, (a) => a.analyse(this._logger))
    )
    .then(() => {
      spinner.succeed('Success!')
      this._displayDependencies()
      this._displayModules()
      this._displayCode()
    })
    .catch((err) => {
      spinner.fail(`Error found: ${err}`)
    })
  }

  /** Displays a message showing the issues with the dependencies.  */
  _displayDependencies () {
    const amount = this._logger.dependencies.length

    console.log(chalk.bold('Dependencies'))
    if (amount === 1) {
      console.log(`1 dependency issue was found.`)
    } else {
      console.log((`${amount} dependency issues were found.`))
    }

    _.map(this._logger.dependencies, (dep) => console.log(`- ${dep}`))
  }

  /** Displays a message showing the issues with the modules.  */
  _displayModules () {
    const amount = this._logger.modules.length

    console.log(chalk.bold('Modules'))
    if (amount === 1) {
      console.log(`1 module issue was found.`)
    } else {
      console.log((`${amount} module issues were found.`))
    }

    _.map(this._logger.modules, (mod) => console.log(`- ${mod}`))
  }

  /** Displays a message showing the issues with the fragments of code.  */
  _displayCode () {
    const amount = this._logger.code.length

    console.log(chalk.bold('Code'))
    if (amount === 1) {
      console.log(`1 code issue was found.`)
    } else {
      console.log((`${amount} code issues were found.`))
    }

    _.map(this._logger.code, (frag) => console.log(`- ${frag}`))
  }

  /**
   * Checks if the given path is a valid project path. To be valid, it needs to
   * point to a folder which contains a valid package.json file.
   *
   * @param {string} p - Path to the project.
   * @return {Object}
   */
  static isValidPath (p) {
    if (fs.existsSync(p)) {
      const pkgPath = path.resolve(p, 'package.json')

      if (fs.existsSync(pkgPath)) {
        const pkg = fs.readFileSync(pkgPath, 'utf-8')
        const validate = validator.validate(pkg)

        if (validate.valid) {
          return { valid: true }
        }

        let reason = 'The package.json found is invalid: '
        for (let index in validate.errors) {
          reason += `\n - ${validate.errors[index]}`
        }
        return { valid: false, error: reason }
      }
      return {
        valid: false,
        error: 'The package.json was not found in the project.'
      }
    }
    return { valid: false, error: 'The given path does not exist.' }
  }
}

module.exports = Project
