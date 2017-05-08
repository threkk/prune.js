const AbstractIssue = require('../abstract/issue')

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
class DependencyIssue extends AbstractIssue {
  /**
   * @constructor
   * @param {Symbol} depType - Type of dependecy issue.
   * @param {string} name - Name of the dependency.
   */
  constructor (depType, name) {
    super(AbstractIssue.DEPENDENCY)
    this.depType = depType
    this.name = name
  }

  toString () {
    let msg
    if (this.depType === DependencyType.DEP) {
      msg = `The dependency ${this.name} is not used.`
    } else if (this.depType === DependencyType.DEV) {
      msg = `The dev-dependency ${this.name} is not used.`
    } else if (this.depType === DependencyType.MIS) {
      msg = `The package ${this.name} has been found in the node_modules but ` +
            `it is not in the package.json`
    }
    return msg
  }

  /**
   * @constant
   * @return {Symbol} Dependency constant.
   */
  static get DEP () {
    return DependencyType.DEP
  }

  /**
   * @constant
   * @return {Symbol} Dev-dependency constant.
   */
  static get DEV () {
    return DependencyType.DEV
  }

  /**
   * @constant
   * @return {Symbol} Missing dependency constant.
   */
  static get MIS () {
    return DependencyType.MIS
  }
}

module.exports = DependencyIssue
