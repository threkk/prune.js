const _ = require('underscore')
const nPath = require('path')

const AbstractAnalyser = require('../abstract/analyser')
const ErrorIssue = require('../project/error')
const Module = require('./module')
const ModuleIssue = require('./issue')

const pkg = require('../../package.json')

/**
 * Analyses the modules of the project, looking for modules that have been
 * declared but never imported, modules that are imported but they are missing
 * and files that import modules but do not export anything else (named as
 * script for convenience).
 */
class ModulesAnalyser extends AbstractAnalyser {
  /**
   * @constructor
   * @param {Config} config - Project configuration.
   * @param {array} files - Array containing the list of file paths of the
   * project.
   */
  constructor (config, files) {
    super()
    this._files = files
    this._root = config.path
    this._withES7 = config.withES7
    this._withJSX = config.withJSX
  }

  /**
   * Executes the analyser and reports the findings to the logger.
   *
   * @param {Logger} logger - Logger to report the findings.
   * @return {Promise} Promise holding the results. These results are also
   * logged in the logger.
   */
  analyse (logger) {
    return new Promise((resolve, reject) => {
      const modules = []

      for (const filePath of this._files) {
        try {
          const module = Module.create(filePath, this._withES7, this._withJSX)

          if (module != null) {
            modules.push(module)
          }
        } catch (e) {
          // Some error has been found by the parser and it is reported to the
          // logger.
          const error = new ErrorIssue(filePath, e)
          logger.report(error)
        }
      }

      const declaredModules = modules.map(module => module.filePath)
      const exportedModules = []
      let importedModules = new Set()

      for (let module of modules) {
        if (module.isExported) {
          exportedModules.push(module.filePath)
        }

        for (let used of module.uses) {
          importedModules.add(used)
        }
      }

      importedModules = [...importedModules]

      const unused = _.difference(exportedModules, importedModules)
      const scripts = _.difference(declaredModules, exportedModules)
      const missing = _.difference(importedModules, declaredModules)

      const unusedIssues = unused.map(path => new ModuleIssue(ModuleIssue.UNUSED, path))
      const missingIssues = missing.map((path) => {
        const ext = nPath.extname(path)

        if (ext === 'js' || ext === 'jsx') {
          return new ModuleIssue(ModuleIssue.MISSING, path)
        }

        return null
      }).filter(path => path != null)

      // We want to avoid marking the defined scripts and the entry point of the
      // project as files which do not export anything.
      let main = null
      if (pkg.main != null) {
        main = nPath.resolve(this._root, pkg.main)
      }

      const binPaths = []
      if (pkg.bin != null) {
        for (let command in pkg.bin) {
          if (pkg.bin[command] != null) {
            binPaths.push(nPath.resolve(this._root, pkg.bin[command]))
          }
        }
      }

      const scriptIssues = scripts.map((path) => {
        if (path === main) {
          return null
        }

        if (binPaths.includes(path)) {
          return null
        }

        return new ModuleIssue(ModuleIssue.SCRIPT, path)
      })
      .filter((path) => path != null)

      const allIssues = [].concat(unusedIssues, missingIssues, scriptIssues)
      allIssues.forEach(issue => logger.report(issue))

      resolve(allIssues)
    })
  }
}

module.exports = ModulesAnalyser
