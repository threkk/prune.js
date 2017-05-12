const fs = require('fs')
const ora = require('ora')
const path = require('path')
const validator = require('package-json-validator').PJV
const _ = require('underscore')

const { extname, resolve } = require('path')

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
    this._files = this._files(config.path)
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
        this._logger.displayDependencies()
        this._logger.displayModules()
        this._logger.displayCode()
      })
      .catch((err) => {
        spinner.fail(`Error found: ${err}`)
      })
  }

  /**
   * Extracts all the file paths from the project. Valid files depend on the
   * configuration. `node_modules` are always ignored.
   */
  _files () {
    const dirs = []
    const files = []
    const validExt = ['.js']

    if (this._config.withJSX) validExt.push('.jsx')

    dirs.push(this._config.path)

    while (dirs.length > 0) {
      const dir = dirs.pop()

      _.each(fs.readdirSync(dir), (file) => {
        const filePath = resolve(dir, file)
        const isIgnored = this._config.ignoreDirs.includes(filePath)
        const isHidden = file.charAt(0) === '.'

        if (!isIgnored && !isHidden) {
          const stats = fs.statSync(filePath)

          if (stats.isDirectory()) {
            dirs.push(filePath)
          } else if (validExt.includes(extname(file))) {
            files.push(filePath)
          }
        }
      })
    }
    return files
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
