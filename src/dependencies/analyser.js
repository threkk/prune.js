const depcheck = require('depcheck')
const { promisify } = require('util')
const path = require('path')
const fs = require('fs')
const process = require('process')

const RPJ = require('read-package-json')
const DependencyReport = require('../project/report/dependency')
const ErrorReport = require('../project/report/error')

const check = promisify(depcheck)
const readJson = promisify(RPJ)

const { DEP, DEV, MIS } = DependencyReport.TYPE

const SPECIALS = {
  babel: depcheck.special.babel,
  eslint: depcheck.special.eslint,
  gulp: depcheck.special['gulp-load-plugins'],
  standard: depcheck.special['feross-standard'],
  mocha: depcheck.special.mocha,
  webpack: depcheck.special.webpack
}

/**
 * Analyses the dependecies of the project looking for issues regarding the
 * usage of them. It targets the depences stored in the sections `dependencies`
 * and `devDependencies` of the `package.json`. It also scans the `node_modules`
 * folder looking for packages installed that are not in the `package.json`.
 */
class DependenciesAnalyser {
  /**
   * @constructor
   * @param {Config} config - Project configuration.
   */
  constructor (config) {
    const parsers = { '*.js': depcheck.parser.es6 }

    if (config.withES7) {
      parsers['*.js'] = depcheck.parser.es7
    }

    if (config.withJSX) {
      parsers['*.jsx'] = depcheck.parser.jsx
    }

    this.path = config.path
    this.config = {
      ignoreDirs: config.ignoreDirs,
      parsers,
      detectors: [
        depcheck.detector.gruntLoadTaskCallExpression, // Not default.
        depcheck.detector.importDeclaration,
        depcheck.detector.requireCallExpression,
        depcheck.detector.requireResolveCallExpression // Not default.
      ],
      specials: [
        depcheck.special.bin
      ]
    }
  }

  /**
   * Executes the analyser and reports the findings to the logger.
   *
   * @param {Logger} logger - Logger to report the findings.
   * @return {Promise} Promise holding the results. These results are also
   * logged in the Logger.
   */
  async analyse (logger, files) {
    const pkgPath = await isValidPath(this.path)
    if (!pkgPath) {
      const error = new ErrorReport(this.path, 'Invalid path')
      logger.report(error)
      return
    }

    // We make our own copy of the configuration for this project. Some of the
    // options cannot be configured globally but per project.
    const config = Object.assign({}, this.config)
    const enablers = Object.keys(SPECIALS)
    const pkg = await readJson(`${pkgPath}/package.json`)

    for (const dep in pkg.dependencies) {
      if (enablers.includes(dep)) {
        config.specials.push(SPECIALS[dep])
      }
    }

    for (const dep in pkg.devDependencies) {
      if (enablers.includes(dep)) {
        config.specials.push(SPECIALS[dep])
      }
    }

    // Depcheck does not follow the standard of nodejs callbacks and instead of
    // returning (error, data), returns only data. Therefore, in order to get
    // the result we need to check if the object returned is the data or a real
    // error to rethrow it.
    let checks = null
    try {
      await check(pkgPath, config)
    } catch (maybeErr) {
      if (maybeErr instanceof Error) {
        throw maybeErr
      }
      checks = maybeErr
    }

    const {
      dependencies,
      devDependencies,
      missing
    } = checks

    dependencies.forEach(dependency => logger.report(new DependencyReport(DEP, dependency)))
    devDependencies.forEach(devDep => logger.report(new DependencyReport(DEV, devDep)))
    Object.keys(missing).forEach(missing => logger.report(new DependencyReport(MIS, missing)))
  }
}

/**
 * Checks if the given path is a valid project path. To be valid, it needs to
 * point to a folder which contains a valid package.json file.
 *
 * @param {string} p - Path to the project.
 * @return {string} Path to the package.json file or false any other case.
 */
async function isValidPath (p) {
  if (!fs.existsSync(p)) {
    return ''
  }
  let pkgPath = null

  if (path.isAbsolute(p)) {
    pkgPath = path.resolve(p, 'package.json')
  } else {
    pkgPath = path.resolve(process.cwd(), p, 'package.json')
  }

  if (!fs.existsSync(pkgPath)) {
    return ''
  }

  const pkg = await readJson(pkgPath)
  if (pkg.dependencies && pkg.devDependencies) {
    return path.dirname(pkgPath)
  }
}

module.exports = DependenciesAnalyser
