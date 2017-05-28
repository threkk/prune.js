const _ = require('underscore')
const nPath = require('path')

const AbstractAnalyser = require('../abstract/analyser')
const ErrorIssue = require('../project/error')
const Module = require('./module')
const ModuleIssue = require('./issue')

const pkg = require('../../package.json')

class ModulesAnalyser extends AbstractAnalyser {
  constructor (config, files) {
    super()
    this._files = files
    this._root = config.path
    this._withES7 = config.withES7
    this._withJSX = config.withJSX
  }

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
          console.log(`Skipped ${path}`)
          return null
        }

        if (binPaths.includes(path)) {
          return null
        }

        return new ModuleIssue(ModuleIssue.SCRIPT, path)
      })

      const allIssues = [].concat(unusedIssues, missingIssues, scriptIssues)
      allIssues.forEach(issue => logger.report(issue))

      resolve(allIssues)
    })
  }
}

module.exports = ModulesAnalyser
