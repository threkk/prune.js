const { DEPENDENCY } = require('./type')

/**
 * Different types of dependecy issues that can be defined.
 *
 * @constant
 * @type {Object}
 * @default
 */
const DependencyType = {
  DEP: Symbol('Dependency'),
  DEV: Symbol('Dev-dependency'),
  MIS: Symbol('Missing')
}

/**
 * Reports an issue regarding the depencies:
 *
 * - Unused `dependecies`.
 * - Unused `devDependencies`.
 * - Modules in `node_modules` not reported in the `package.json`.
 */
class DependencyReport {
  /**
   * @constructor
   * @param {Symbol} depType - Type of dependecy issue.
   * @param {string} name - Name of the dependency.
   * @throws Error - If `depType` is not a valid dependency type.
   */
  constructor (depType, name) {
    this.dep = depType
    this.name = name
    this.type = DependencyReport.symbol()
  }

  toString () {
    let msg
    if (this.dep === DependencyType.DEP) {
      msg = `The dependency ${this.name} is not used.`
    } else if (this.dep === DependencyType.DEV) {
      msg = `The dev-dependency ${this.name} is not used.`
    } else if (this.dep === DependencyType.MIS) {
      msg = `The package ${this.name} has been found in the node_modules but ` +
            `it is not in the package.json`
    }
    return msg
  }

  static symbol () {
    return DEPENDENCY
  }
}

module.exports = DependencyReport
module.exports.TYPE = DependencyType
