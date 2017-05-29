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
   * @throws Error - If `depType` is not a valid dependency type.
   */
  constructor (depType, name) {
    super(AbstractIssue.DEPENDENCY)

    if (!Object.values(DependencyType).includes(depType)) {
      throw new Error(`The type ${depType} is not a valid type.`)
    }

    this._depType = depType
    this._name = name
  }

  toString () {
    let msg
    if (this._depType === DependencyType.DEP) {
      msg = `The dependency ${this._name} is not used.`
    } else if (this._depType === DependencyType.DEV) {
      msg = `The dev-dependency ${this._name} is not used.`
    } else if (this._depType === DependencyType.MIS) {
      msg = `The package ${this._name} has been found in the node_modules but ` +
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
