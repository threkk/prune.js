const { MODULE } = require('./type')

/**
 * Different types of module issues that can be defined.
 *
 * @constant
 * @type {Object}
 * @default
 */
const ModuleCase = {
  UNUSED: Symbol('Unused'),
  LEAF: Symbol('Leaf'),
  MISSING: Symbol('Missing')
}

/**
 * Reports an issue regarding the modules:
 *
 * - Unused modules (exported but not imported).
 * - Missing modules (imported but not exported).
 * - Scripts (modules which import other modules but do not export anything).
 */
class ModuleReport {
  /**
   * @constructor
   * @param {Symbol} modType - Case of module we are facing.
   * @param {string} path - Path to the module.
   * @throws Error - If `modCase` is not a valid module case.
   */
  constructor (modCase, path) {
    if (!Object.values(ModuleCase).includes(modCase)) {
      throw Error(`The type ${modCase} is not a valid type.`)
    }

    this.modCase = modCase
    this.path = path
    this.type = ModuleReport.symbol()
  }

  toString () {
    switch (this.modCase) {
      case ModuleCase.UNUSED:
        return `The module ${this.path} is unused: it has been exported but ` +
          `never imported.`
      case ModuleCase.LEAF:
        return `The module ${this.path} is not connected: it uses ` +
          `other modules but it is not exported or part of the main function.`
      case ModuleCase.MISSING:
        return `The module ${this.path} has been imported by other modules ` +
          `it could not be found in the project.`
    }
  }

  static symbol () {
    return MODULE
  }
}

module.exports = ModuleReport
module.exports.TYPE = ModuleCase
