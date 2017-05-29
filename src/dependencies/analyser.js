const depcheck = require('depcheck')

const AbstractAnalyser = require('../abstract/analyser')
const DependencyIssue = require('./issue')

/**
 * Analyses the dependecies of the project looking for issues regarding the
 * usage of them. It targets the depences stored in the sections `dependencies`
 * and `devDependencies` of the `package.json`. It also scans the `node_modules`
 * folder looking for packages installed that are not in the `package.json`.
 */
class DependenciesAnalyser extends AbstractAnalyser {
  /**
   * @constructor
   * @param {Config} config - Project configuration.
   */
  constructor (config, files) {
    super()

    const parsers = {
      '*.js': depcheck.parser.es6
    }

    if (config.withES7) {
      parsers['*.js'] = depcheck.parser.es7
    }

    if (config.withJSX) {
      parsers['*.jsx'] = depcheck.parser.jsx
    }

    this._path = config.path
    this._config = {
      ignoreDirs: config.ignoreDirs,
      parsers,
      detectors: [
        depcheck.detector.gruntLoadTaskCallExpression, // Not default.
        depcheck.detector.importDeclaration,
        depcheck.detector.requireCallExpression,
        depcheck.detector.requireResolveCallExpression // Not default.
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
  analyse (logger) {
    return new Promise((resolve, reject) => {
      depcheck(this._path, this._config, (unused) => {
        const reports = [].concat(
          unused.dependencies.map((dependency) =>
            new DependencyIssue(DependencyIssue.DEP, dependency)),
          unused.devDependencies.map((devDep) =>
            new DependencyIssue(DependencyIssue.DEV, devDep)),
          Object.values(unused.missing).map((missing) =>
            new DependencyIssue(DependencyIssue.MIS, missing))
        )
        reports.forEach((report) => logger.report(report))
        // Should we remove the body of this resolve? It has been stored already
        // in the logger.
        resolve(reports)
      })
    })
  }
}

module.exports = DependenciesAnalyser
