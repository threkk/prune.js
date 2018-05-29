const _ = require('underscore')
const { resolve, extname } = require('path')

const ErrorReport = require('../project/report/error')
const ModuleReport = require('../project/report/module')
const { LEAF, MISSING, UNUSED } = ModuleReport.TYPE
const { analyseFile } = require('./module')

const pkg = require('../../package.json')

/**
 * Analyses the modules of the project, looking for modules that have been
 * declared but never imported, modules that are imported but they are missing
 * and files that import modules but do not export anything else (named as
 * script for convenience).
 */
class ModulesAnalyser {
  /**
   * @constructor
   * @param {Config} config - Project configuration.
   * @param {array} files - Array containing the list of file paths of the
   * project.
   */
  constructor (config) {
    this.root = config.path
    this.withES7 = config.withES7
    this.withJSX = config.withJSX
  }

  /**
   * Executes the analyser and reports the findings to the logger.
   *
   * @param {Logger} logger - Logger to report the findings.
   * @return {Promise} Promise holding the results. These results are also
   * logged in the logger.
   */
  async analyse (logger, files) {
    const modules = (await Promise.all(files.map(async file => {
      try {
        return await analyseFile(file, this.withES7, this.withJSX)
      } catch (e) {
        // Some error has been found by the parser and it is reported to the logger.
        const error = new ErrorReport(file, e)
        logger.report(error)
        return null
      }
    })))
    .filter(maybeModule => maybeModule != null)

    const declaredModules = modules.map(module => module.filePath)
    const exportedModules = (await Promise.all(modules.map(async module =>
      module.isExported ? module.filePath : null)))
    .filter(maybeModule => maybeModule != null)

    let importedModules = new Set()
    for (let module of modules) {
      for (let used of module.uses) {
        importedModules.add(used)
      }
    }

    // Set to array.
    importedModules = [...importedModules]

    const unused = _.difference(exportedModules, importedModules)
    const scripts = _.difference(declaredModules, exportedModules)
    const missing = _.difference(importedModules, declaredModules)

    const unusedReports = unused.map(path => new ModuleReport(UNUSED, path))
    const missingReports = missing.map((path) => {
      const ext = extname(path)

      if (ext === 'js' || ext === 'jsx') {
        return new ModuleReport(MISSING, path)
      }

      return null
    })
    .filter(path => path != null)

    // We want to avoid marking the defined scripts and the entry point of the
    // project as files which do not export anything.
    let main = null
    if (pkg.main != null) {
      main = resolve(this.root, pkg.main)
    }

    const binPaths = []
    if (pkg.bin != null) {
      for (let command in pkg.bin) {
        if (pkg.bin[command] != null) {
          binPaths.push(resolve(this.root, pkg.bin[command]))
        }
      }
    }

    const leafReports = scripts.map((path) => {
      if (path === main) {
        return null
      }

      if (binPaths.includes(path)) {
        return null
      }

      return new ModuleReport(LEAF, path)
    }).filter((path) => path != null)

    const allReports = [].concat(unusedReports, missingReports, leafReports)
    allReports.forEach(report => logger.report(report))

    return allReports
  }
}

module.exports = ModulesAnalyser
