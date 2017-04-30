const fs = require('fs')
const path = require('path')
const validator = require('package-json-validator').PJV

/**
 * The Project class acts as a monad and holds all the different analysers to
 * apply to the project.
 */
class Project {
  /**
   * Creates a Project instance
   *
   * @constructor
   * @param {string} p - Path to the project.
   * @param {Logger} logger - Logger where the analysers report their findings.
   */
  constructor (p, logger) {
    this._path = path.resolve(p)
    this._logger = logger
  }

  /**
   * Attaches the analyser to the project. It will report its findings to the
   * logger.
   *
   * @param {Analyser} analyser - Analyser to attach.
   */
  analyse (analyser) {
    analyser.analyse(this._path, this._logger)
    return this
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
