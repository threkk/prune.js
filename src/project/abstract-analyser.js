/**
* Parent abstract class.
*
* @abstract
*/
class AbstractAnalyser {
  /** @constructor */
  constructor () {
    if (new.target === AbstractAnalyser) {
      throw TypeError('new of abstract class Analyser')
    }

    if (this.analyse === undefined || typeof this.analyse !== 'function') {
      throw new TypeError('The method `analyse` is not defined.')
    }
  }
}

module.exports = AbstractAnalyser
