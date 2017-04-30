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
class Report {
  /** @constructor */
  constructor (type) {
    if (new.target === Report) {
      throw TypeError('new of abstract class Report')
    }

    if (this.display === undefined || typeof this.display !== 'function') {
      throw new TypeError('The method `display` is not defined.')
    }
    this.type = type
  }

  /**
   * @return {Symbol} Dependency constant.
   */
  static get DEPENDENCY () {
    return Type.DEPENDENCY
  }

  /**
   * @return {Symbol} Module constant.
   */
  static get MODULE () {
    return Type.MODULE
  }

  /**
   * @return {Symbol} Code constant.
   */
  static get CODE () {
    return Type.CODE
  }
}

module.exports = Report
