const AbstractIssue = require('../abstract/issue')

const ModuleCase = {
  UNUSED: Symbol('Unused'),
  SCRIPT: Symbol('Script'),
  MISSING: Symbol('Missing')
}

class ModuleIssue extends AbstractIssue {
  constructor (modCase, path) {
    super(AbstractIssue.MODULE)
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

  static get UNUSED () {
    return ModuleCase.UNUSED
  }

  static get SCRIPT () {
    return ModuleCase.SCRIPT
  }

  static get MISSING () {
    return ModuleCase.MISSING
  }
}

module.exports = ModuleIssue
