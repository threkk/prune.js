const AbstractIssue = require('../abstract/issue')

/**
 * Different types of module issues that can be defined.
 *
 * @constant
 * @type {Object}
 * @default
 */
const ModuleCase = {
  UNUSED: Symbol('Unused'),
  SCRIPT: Symbol('Script'),
  MISSING: Symbol('Missing')
}

/**
 * Reports an issue regarding the modules:
 *
 * - Unused modules (exported but not imported).
 * - Missing modules (imported but not exported).
 * - Scripts (modules which import other modules but do not export anything).
 */
class ModuleIssue extends AbstractIssue {
  /**
   * @constructor
   * @param {Symbol} modType - Case of module we are facing.
   * @param {string} path - Path to the module.
   * @throws Error - If `modCase` is not a valid module case.
   */
  constructor (modCase, path) {
    super(AbstractIssue.MODULE)

    if (!Object.values(ModuleCase).includes(modCase)) {
      throw Error(`The type ${modCase} is not a valid type.`)
    }

    this._modCase = modCase
    this._path = path
  }

  toString () {
    switch (this._modCase) {
      case ModuleCase.UNUSED:
        return `The module ${this._path} is unused: It has been exported but ` +
          `never imported.`
      case ModuleCase.SCRIPT:
        return `The module ${this._path} has been marked as a script: it uses ` +
          `other modules but it is not exported. Maybe you want to check if ` +
          `it is still relevant.`
      case ModuleCase.MISSING:
        return `The module ${this._path} has been imported by other modules ` +
          `it could not be found in the project.`
    }
  }

  /**
   * @constant
   * @return {Symbol} Unused module constant.
   */
  static get UNUSED () {
    return ModuleCase.UNUSED
  }

  /**
   * @constant
   * @return {Symbol} Script module constant.
   */
  static get SCRIPT () {
    return ModuleCase.SCRIPT
  }

  /**
   * @constant
   * @return {Symbol} Missing module constant.
   */
  static get MISSING () {
    return ModuleCase.MISSING
  }
}

module.exports = ModuleIssue
