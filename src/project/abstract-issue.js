/**
 * Different types of reports that can be defined.
 *
 * @constant
 * @type {Object}
 * @default
 */
const Type = {
  DEPENDENCY: Symbol('DEPENDENCY'),
  MODULE: Symbol('MODULE'),
  CODE: Symbol('CODE')
}

/**
 * Parent abstract class.
 *
 * @abstract
 */
class AbstractIssue {
  /**
   * @constructor
   * @param {Symbol} type - Type of report created.
   */
  constructor (type) {
    if (new.target === AbstractIssue) {
      throw TypeError('new of abstract class AbstractIssue')
    }

    this.type = type
  }

  /**
   * @constant
   * @return {Symbol} Dependency constant.
   */
  static get DEPENDENCY () {
    return Type.DEPENDENCY
  }

  /**
   * @constant
   * @return {Symbol} Module constant.
   */
  static get MODULE () {
    return Type.MODULE
  }

  /**
   * @constant
   * @return {Symbol} Code constant.
   */
  static get CODE () {
    return Type.CODE
  }
}
module.exports = AbstractIssue